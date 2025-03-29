from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
import json
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import firebase_admin
from firebase_admin import credentials, auth
import stripe
from pydantic import BaseModel
from fastapi import APIRouter
from fastapi.responses import JSONResponse, RedirectResponse
from dotenv import load_dotenv

load_dotenv()

# Configuração do Firebase para autenticação Google
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
else:
    # Use a string de credenciais da variável de ambiente como fallback
    firebase_credentials = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_credentials:
        cred_dict = json.loads(firebase_credentials)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    else:
        raise ValueError("Firebase credentials not found")

# Configuração do Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
if not stripe.api_key:
    raise ValueError("STRIPE_SECRET_KEY environment variable not set")

# Preço do plano de assinatura
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
if not STRIPE_PRICE_ID:
    raise ValueError("STRIPE_PRICE_ID environment variable not set")

# Configuração JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias

# Router para autenticação
auth_router = APIRouter()

# Modelos Pydantic


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    uid: Optional[str] = None


class User(BaseModel):
    email: str
    uid: str
    api_calls_remaining: int = 3  # Usuários novos têm 3 chamadas gratuitas
    is_premium: bool = False
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None


# Banco de dados simplificado (em produção usar um banco de dados real)
# Mapeamento de email para dados do usuário
users_db: Dict[str, Dict[str, Any]] = {}

# Funções de autenticação


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_firebase_token(id_token: str):
    try:
        # Verificar o token do Firebase
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Função para obter o usuário atual a partir do token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        uid: str = payload.get("uid")
        if email is None or uid is None:
            raise credentials_exception
        token_data = TokenData(email=email, uid=uid)
    except JWTError:
        raise credentials_exception

    if email not in users_db:
        raise credentials_exception

    user_data = users_db[email]
    return User(**user_data)

# Verificar se o usuário pode fazer chamadas de API


async def check_api_access(user: User = Depends(get_current_user)):
    if user.is_premium:
        return user  # Usuários premium têm acesso ilimitado

    if user.api_calls_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No API calls remaining. Please upgrade to premium."
        )

    # Reduzir o número de chamadas restantes
    users_db[user.email]["api_calls_remaining"] -= 1
    return user

# Rotas de autenticação


@auth_router.post("/auth/google")
async def login_with_google(id_token: str):
    try:
        # Verificar o token do Firebase
        decoded_token = verify_firebase_token(id_token)

        email = decoded_token["email"]
        uid = decoded_token["uid"]

        # Verificar se o usuário já existe
        if email not in users_db:
            # Criar um novo usuário
            # Criar cliente no Stripe
            stripe_customer = stripe.Customer.create(
                email=email,
                metadata={"firebase_uid": uid}
            )

            # Salvar usuário no banco de dados
            users_db[email] = {
                "email": email,
                "uid": uid,
                "api_calls_remaining": 3,  # 3 chamadas gratuitas
                "is_premium": False,
                "stripe_customer_id": stripe_customer.id,
                "stripe_subscription_id": None
            }

        # Gerar token JWT
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email, "uid": uid},
            expires_delta=access_token_expires
        )

        # Retornar token
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": users_db[email]
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@auth_router.get("/user/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Funções para Stripe


@auth_router.post("/create-checkout-session")
async def create_checkout_session(current_user: User = Depends(get_current_user)):
    try:
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": STRIPE_PRICE_ID,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") +
            "/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=os.getenv(
                "FRONTEND_URL", "http://localhost:3000") + "/cancel",
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.post("/webhook")
async def stripe_webhook(request: Request):
    try:
        # Obter o payload
        payload = await request.body()

        # Verificar se há um cabeçalho de assinatura do Stripe
        sig_header = request.headers.get("stripe-signature")
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        # Carregar o evento - com ou sem verificação
        if webhook_secret and sig_header:
            try:
                # Tentar validar a assinatura se tiver secret configurado
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            except ValueError as e:
                print(f"⚠️ Webhook error: {str(e)}")
                return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid payload"})
            except stripe.error.SignatureVerificationError as e:
                print(f"⚠️ Webhook signature verification failed: {str(e)}")
                return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid signature"})
        else:
            # Sem secret configurado, apenas decodificar JSON
            try:
                event = json.loads(payload)
            except json.JSONDecodeError as e:
                print(f"⚠️ Webhook JSON decoding error: {str(e)}")
                return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid JSON"})

        # Processar o evento
        event_type = event.get("type")

        if event_type == "checkout.session.completed":
            session = event["data"]["object"]

            # Atualizar status de assinatura do cliente
            customer_id = session["customer"]
            subscription_id = session["subscription"]

            print(
                f"✅ Checkout session completed for customer {customer_id}, subscription {subscription_id}")

            # Encontrar usuário pelo customer_id
            for email, user_data in users_db.items():
                if user_data["stripe_customer_id"] == customer_id:
                    users_db[email]["is_premium"] = True
                    users_db[email]["stripe_subscription_id"] = subscription_id
                    print(f"✅ User {email} upgraded to premium")
                    break

        elif event_type == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            subscription_id = subscription["id"]
            customer_id = subscription.get("customer")

            print(
                f"❌ Subscription {subscription_id} canceled for customer {customer_id}")

            # Encontrar usuário pela subscription_id
            for email, user_data in users_db.items():
                if user_data["stripe_subscription_id"] == subscription_id:
                    users_db[email]["is_premium"] = False
                    users_db[email]["stripe_subscription_id"] = None
                    print(f"❌ Premium access revoked for user {email}")
                    break

        elif event_type == "invoice.payment_failed":
            invoice = event["data"]["object"]
            customer_id = invoice.get("customer")
            subscription_id = invoice.get("subscription")

            print(
                f"⚠️ Payment failed for customer {customer_id}, subscription {subscription_id}")
            # Aqui você poderia enviar um email de notificação ao usuário

        elif event_type == "customer.subscription.updated":
            subscription = event["data"]["object"]
            status = subscription.get("status")
            customer_id = subscription.get("customer")
            subscription_id = subscription.get("id")

            print(
                f"ℹ️ Subscription {subscription_id} updated for customer {customer_id}, status: {status}")

            # Atualizar status se necessário baseado no status da assinatura
            if status == "active":
                for email, user_data in users_db.items():
                    if user_data["stripe_customer_id"] == customer_id:
                        users_db[email]["is_premium"] = True
                        users_db[email]["stripe_subscription_id"] = subscription_id
                        break
            elif status in ["canceled", "unpaid", "past_due"]:
                for email, user_data in users_db.items():
                    if user_data["stripe_customer_id"] == customer_id:
                        users_db[email]["is_premium"] = False
                        break

        # Sempre retornar sucesso 200 para o Stripe não tentar reenviar o evento
        return JSONResponse(content={"status": "success", "event_type": event_type})

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        # Retornar 200 mesmo no erro para evitar que o Stripe tente reenviar o evento
        return JSONResponse(content={"status": "error", "message": f"Error handled: {str(e)}"})
# URL para iniciar o fluxo de autenticação Google


@auth_router.get("/login/google")
async def login_google():
    redirect_url = os.getenv(
        "FRONTEND_URL", "http://localhost:3000") + "/auth-google"
    return RedirectResponse(url=redirect_url)

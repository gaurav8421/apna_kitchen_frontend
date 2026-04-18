# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working Django + React foundation with multi-tenant auth, organizations, and branch management — everything Phase 2 (POS) builds on.

**Architecture:** Shared PostgreSQL database with `organization_id` on every tenant-scoped resource. JWT auth (simplejwt) with role claims baked into the token. React frontend uses Zustand for auth state and React Query for server state.

**Tech Stack:** Django 5.x, DRF, djangorestframework-simplejwt, PostgreSQL, Redis, Docker · React 18, Vite, Tailwind CSS 3, Zustand, React Query (TanStack Query v5), React Router v6, Axios, Vitest

**Roots:**
- Backend: `~/Desktop/pulse-backend/`
- Frontend: `~/Desktop/pulse frontend v1/`

---

## File Map

### Backend (`~/Desktop/pulse-backend/`)

| File | Responsibility |
|---|---|
| `docker-compose.yml` | PostgreSQL + Redis services |
| `requirements/base.txt` | Shared dependencies |
| `requirements/development.txt` | Dev extras (pytest, factory-boy) |
| `config/settings/base.py` | Shared Django settings |
| `config/settings/development.py` | Dev overrides |
| `config/urls.py` | Root URL config |
| `config/asgi.py` | ASGI entry (needed later for Channels) |
| `apps/organizations/models.py` | `Organization` model |
| `apps/organizations/serializers.py` | Org serializer |
| `apps/organizations/views.py` | Org detail/update |
| `apps/organizations/urls.py` | Org routes |
| `apps/accounts/models.py` | `User` model (custom, role-based) |
| `apps/accounts/serializers.py` | Register + token serializers |
| `apps/accounts/views.py` | Register + login views |
| `apps/accounts/permissions.py` | Role-based permission classes |
| `apps/accounts/urls.py` | Auth routes |
| `apps/branches/models.py` | `Branch` model |
| `apps/branches/serializers.py` | Branch serializer |
| `apps/branches/views.py` | Branch CRUD |
| `apps/branches/urls.py` | Branch routes |
| `tests/conftest.py` | pytest fixtures (org, users, client) |
| `tests/test_auth.py` | Registration + login tests |
| `tests/test_branches.py` | Branch CRUD tests |

### Frontend (`~/Desktop/pulse frontend v1/`)

| File | Responsibility |
|---|---|
| `package.json` | Dependencies |
| `vite.config.js` | Vite + Vitest config |
| `tailwind.config.js` | Tailwind setup |
| `src/main.jsx` | App entry |
| `src/App.jsx` | Router root |
| `src/router/index.jsx` | Routes + role guards |
| `src/store/authStore.js` | Zustand auth state (persisted) |
| `src/api/client.js` | Axios instance + JWT interceptors |
| `src/api/auth.js` | React Query hooks for auth |
| `src/pages/auth/Login.jsx` | Login form |
| `src/pages/auth/Register.jsx` | Org signup form |
| `src/components/layout/Sidebar.jsx` | Nav sidebar (role-aware) |
| `src/components/layout/TopBar.jsx` | Top bar (branch switcher, user menu) |
| `src/components/layout/AppLayout.jsx` | Authenticated shell |
| `src/pages/dashboard/Dashboard.jsx` | Placeholder dashboard |
| `src/tests/Login.test.jsx` | Login page tests |
| `src/tests/Register.test.jsx` | Register page tests |

---

## Task 1: Django project + Docker

**Files:**
- Create: `~/Desktop/pulse-backend/docker-compose.yml`
- Create: `~/Desktop/pulse-backend/requirements/base.txt`
- Create: `~/Desktop/pulse-backend/requirements/development.txt`
- Create: `~/Desktop/pulse-backend/config/settings/base.py`
- Create: `~/Desktop/pulse-backend/config/settings/development.py`
- Create: `~/Desktop/pulse-backend/.env.example`

- [ ] **Step 1: Create the project directory and scaffold**

```bash
mkdir ~/Desktop/pulse-backend
cd ~/Desktop/pulse-backend
python3 -m venv venv
source venv/bin/activate
pip install django==5.0.* djangorestframework djangorestframework-simplejwt \
  django-cors-headers psycopg2-binary redis django-filter \
  drf-spectacular python-decouple
pip install --dev pytest-django pytest factory-boy faker
```

- [ ] **Step 2: Create requirements files**

`requirements/base.txt`:
```
Django==5.0.14
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4.0
psycopg2-binary==2.9.9
redis==5.0.8
django-filter==24.3
drf-spectacular==0.27.2
python-decouple==3.8
```

`requirements/development.txt`:
```
-r base.txt
pytest==8.3.3
pytest-django==4.9.0
factory-boy==3.3.1
faker==30.3.0
```

- [ ] **Step 3: Run `django-admin startproject config .`**

```bash
cd ~/Desktop/pulse-backend
django-admin startproject config .
```

- [ ] **Step 4: Create app directories**

```bash
mkdir -p apps/organizations apps/accounts apps/branches tests
touch apps/__init__.py apps/organizations/__init__.py \
  apps/accounts/__init__.py apps/branches/__init__.py
```

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: pulse
      POSTGRES_USER: pulse
      POSTGRES_PASSWORD: pulse
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

- [ ] **Step 6: Create `.env.example`**

```
SECRET_KEY=change-me-in-production
DEBUG=True
DB_NAME=pulse
DB_USER=pulse
DB_PASSWORD=pulse
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Copy `.env.example` to `.env`.

- [ ] **Step 7: Create `config/settings/base.py`**

```python
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third party
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # local
    'apps.organizations',
    'apps.accounts',
    'apps.branches',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'accounts.User'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='pulse'),
        'USER': config('DB_USER', default='pulse'),
        'PASSWORD': config('DB_PASSWORD', default='pulse'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173').split(',')

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True
```

- [ ] **Step 8: Create `config/settings/development.py`**

```python
from .base import *

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = True
```

- [ ] **Step 9: Update `config/urls.py`**

```python
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerUIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/organizations/', include('apps.organizations.urls')),
    path('api/v1/branches/', include('apps.branches.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerUIView.as_view(url_name='schema'), name='swagger-ui'),
]
```

- [ ] **Step 10: Create `pytest.ini`**

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.development
python_files = tests/test_*.py
python_classes = Test*
python_functions = test_*
```

- [ ] **Step 11: Start Docker services and verify**

```bash
cd ~/Desktop/pulse-backend
docker-compose up -d
```

Expected: containers `pulse-backend-db-1` and `pulse-backend-redis-1` running.

- [ ] **Step 12: Commit**

```bash
cd ~/Desktop/pulse-backend
git init
git add .
git commit -m "feat: scaffold Django project with Docker, settings, requirements"
```

---

## Task 2: Organization model

**Files:**
- Create: `apps/organizations/models.py`
- Create: `apps/organizations/serializers.py`
- Create: `apps/organizations/views.py`
- Create: `apps/organizations/urls.py`

- [ ] **Step 1: Write `apps/organizations/models.py`**

```python
import uuid
from django.db import models

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=220)
    logo_url = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    gstin = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.name
```

- [ ] **Step 2: Write `apps/organizations/serializers.py`**

```python
from rest_framework import serializers
from .models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'logo_url', 'phone', 'email', 'gstin', 'address', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']
```

- [ ] **Step 3: Write `apps/organizations/views.py`**

```python
from rest_framework import generics, permissions
from .models import Organization
from .serializers import OrganizationSerializer

class OrganizationMeView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.organization
```

- [ ] **Step 4: Write `apps/organizations/urls.py`**

```python
from django.urls import path
from .views import OrganizationMeView

urlpatterns = [
    path('me/', OrganizationMeView.as_view(), name='org-me'),
]
```

- [ ] **Step 5: Run migrations**

```bash
cd ~/Desktop/pulse-backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py makemigrations organizations
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate
```

Expected: migrations applied successfully.

- [ ] **Step 6: Commit**

```bash
git add apps/organizations/ config/
git commit -m "feat: add Organization model and /api/v1/organizations/me/ endpoint"
```

---

## Task 3: User model + JWT auth

**Files:**
- Create: `apps/accounts/models.py`
- Create: `apps/accounts/permissions.py`
- Create: `apps/accounts/serializers.py`
- Create: `apps/accounts/views.py`
- Create: `apps/accounts/urls.py`

- [ ] **Step 1: Write the failing test first**

`tests/test_auth.py`:
```python
import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_register_creates_org_and_owner(client):
    payload = {
        'org_name': 'Spice Garden',
        'name': 'Rahul Sharma',
        'email': 'rahul@spicegarden.com',
        'password': 'SecurePass123',
    }
    response = client.post(reverse('auth-register'), payload, content_type='application/json')
    assert response.status_code == 201
    data = response.json()
    assert data['user']['role'] == 'owner'
    assert data['user']['org_name'] == 'Spice Garden'
    assert 'access' in data
    assert 'refresh' in data

@pytest.mark.django_db
def test_login_returns_tokens(client, django_user_model):
    from apps.organizations.models import Organization
    org = Organization.objects.create(name='Test Org', slug='test-org')
    django_user_model.objects.create_user(
        email='test@test.com', password='pass1234', name='Test', organization=org, role='owner'
    )
    response = client.post(reverse('auth-login'), {
        'email': 'test@test.com', 'password': 'pass1234'
    }, content_type='application/json')
    assert response.status_code == 200
    assert 'access' in response.json()

@pytest.mark.django_db
def test_register_duplicate_email_fails(client):
    from apps.organizations.models import Organization
    from apps.accounts.models import User
    org = Organization.objects.create(name='Org', slug='org')
    User.objects.create_user(email='dup@test.com', password='pass', name='Dup', organization=org)
    response = client.post(reverse('auth-register'), {
        'org_name': 'New Org', 'name': 'New', 'email': 'dup@test.com', 'password': 'pass1234'
    }, content_type='application/json')
    assert response.status_code == 400
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/Desktop/pulse-backend
source venv/bin/activate
pytest tests/test_auth.py -v
```

Expected: FAIL — `apps.accounts.models` import error (model doesn't exist yet).

- [ ] **Step 3: Write `apps/accounts/models.py`**

```python
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('super_admin', 'Super Admin'),
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
        ('kitchen', 'Kitchen'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='users'
    )
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='users'
    )
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLES, default='cashier')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email
```

- [ ] **Step 4: Write `apps/accounts/permissions.py`**

```python
from rest_framework.permissions import BasePermission

class IsOwnerOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('super_admin', 'owner', 'manager')
        )

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('super_admin', 'owner')
        )

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role == 'super_admin'
        )
```

- [ ] **Step 5: Write `apps/accounts/serializers.py`**

```python
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.utils.text import slugify
from .models import User
from apps.organizations.models import Organization


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['org_id'] = str(user.organization_id) if user.organization_id else None
        token['name'] = user.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': str(self.user.id),
            'name': self.user.name,
            'email': self.user.email,
            'role': self.user.role,
            'org_id': str(self.user.organization_id) if self.user.organization_id else None,
            'org_name': self.user.organization.name if self.user.organization else None,
        }
        return data


class RegisterSerializer(serializers.Serializer):
    org_name = serializers.CharField(max_length=200)
    org_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    org_email = serializers.EmailField(required=False, allow_blank=True, default='')
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        slug = slugify(validated_data['org_name'])
        base_slug, counter = slug, 1
        while Organization.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        org = Organization.objects.create(
            name=validated_data['org_name'],
            slug=slug,
            phone=validated_data['org_phone'],
            email=validated_data['org_email'],
        )
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            organization=org,
            role='owner',
        )
        return user, org
```

- [ ] **Step 6: Write `apps/accounts/views.py`**

```python
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, org = serializer.save()
        refresh = RefreshToken.for_user(user)
        # Add custom claims
        refresh['role'] = user.role
        refresh['org_id'] = str(org.id)
        refresh['name'] = user.name
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'org_id': str(org.id),
                'org_name': org.name,
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 7: Write `apps/accounts/urls.py`**

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, LogoutView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
]
```

- [ ] **Step 8: Run migrations**

```bash
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py makemigrations accounts
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pytest tests/test_auth.py -v
```

Expected: 3 PASSED.

- [ ] **Step 10: Commit**

```bash
git add apps/accounts/
git commit -m "feat: add User model, JWT auth, register/login/logout endpoints"
```

---

## Task 4: Branch model + API

**Files:**
- Create: `apps/branches/models.py`
- Create: `apps/branches/serializers.py`
- Create: `apps/branches/views.py`
- Create: `apps/branches/urls.py`
- Create: `tests/test_branches.py`

- [ ] **Step 1: Write the failing test**

`tests/test_branches.py`:
```python
import pytest
from django.urls import reverse
from apps.organizations.models import Organization
from apps.accounts.models import User
from apps.branches.models import Branch


@pytest.fixture
def org():
    return Organization.objects.create(name='Test Org', slug='test-org-branch')


@pytest.fixture
def owner(org):
    return User.objects.create_user(
        email='owner@test.com', password='pass1234',
        name='Owner', organization=org, role='owner'
    )


@pytest.fixture
def auth_client(client, owner):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = str(RefreshToken.for_user(owner).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client


@pytest.mark.django_db
def test_create_branch(auth_client, org):
    response = auth_client.post(reverse('branch-list'), {
        'name': 'Main Branch',
        'address': '123 MG Road',
        'tax_rate': '5.00',
    }, content_type='application/json')
    assert response.status_code == 201
    assert response.json()['name'] == 'Main Branch'


@pytest.mark.django_db
def test_list_branches_scoped_to_org(auth_client, org):
    Branch.objects.create(organization=org, name='Branch A')
    Branch.objects.create(organization=org, name='Branch B')
    other_org = Organization.objects.create(name='Other', slug='other')
    Branch.objects.create(organization=other_org, name='Other Branch')

    response = auth_client.get(reverse('branch-list'))
    assert response.status_code == 200
    names = [b['name'] for b in response.json()]
    assert 'Branch A' in names
    assert 'Branch B' in names
    assert 'Other Branch' not in names


@pytest.mark.django_db
def test_cashier_cannot_create_branch(client, org):
    cashier = User.objects.create_user(
        email='cashier@test.com', password='pass1234',
        name='Cashier', organization=org, role='cashier'
    )
    from rest_framework_simplejwt.tokens import RefreshToken
    token = str(RefreshToken.for_user(cashier).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    response = client.post(reverse('branch-list'), {
        'name': 'Cashier Branch'
    }, content_type='application/json')
    assert response.status_code == 403
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_branches.py -v
```

Expected: FAIL — `apps.branches.models` import error.

- [ ] **Step 3: Write `apps/branches/models.py`**

```python
import uuid
from django.db import models


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='branches'
    )
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    gstin = models.CharField(max_length=15, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    currency = models.CharField(max_length=3, default='INR')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'branches'
        verbose_name_plural = 'branches'

    def __str__(self):
        return f'{self.organization.name} — {self.name}'
```

- [ ] **Step 4: Write `apps/branches/serializers.py`**

```python
from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'address', 'phone', 'gstin',
            'tax_rate', 'currency', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
```

- [ ] **Step 5: Write `apps/branches/views.py`**

```python
from rest_framework import generics, permissions
from .models import Branch
from .serializers import BranchSerializer
from apps.accounts.permissions import IsOwnerOrManager


class BranchListCreateView(generics.ListCreateAPIView):
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsOwnerOrManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Branch.objects.filter(
            organization=self.request.user.organization,
            is_active=True
        ).order_by('name')

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManager]

    def get_queryset(self):
        return Branch.objects.filter(organization=self.request.user.organization)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
```

- [ ] **Step 6: Write `apps/branches/urls.py`**

```python
from django.urls import path
from .views import BranchListCreateView, BranchDetailView

urlpatterns = [
    path('', BranchListCreateView.as_view(), name='branch-list'),
    path('<uuid:pk>/', BranchDetailView.as_view(), name='branch-detail'),
]
```

- [ ] **Step 7: Run migrations and tests**

```bash
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py makemigrations branches
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate
pytest tests/test_branches.py -v
```

Expected: 3 PASSED.

- [ ] **Step 8: Commit**

```bash
git add apps/branches/ tests/
git commit -m "feat: add Branch model and scoped CRUD API with role permissions"
```

---

## Task 5: React app scaffolding

**Files:** All in `~/Desktop/pulse frontend v1/`
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Initialise Vite + React project**

```bash
cd ~/Desktop/pulse\ frontend\ v1
npm create vite@latest . -- --template react
npm install
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install \
  react-router-dom@6 \
  zustand \
  @tanstack/react-query \
  axios \
  tailwindcss postcss autoprefixer \
  @headlessui/react \
  lucide-react \
  react-hot-toast \
  dayjs

npm install -D \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

- [ ] **Step 3: Init Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Update `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        }
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Update `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    }
  }
})
```

- [ ] **Step 6: Create `src/tests/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Commit**

```bash
cd ~/Desktop/pulse\ frontend\ v1
git init
git add .
git commit -m "feat: scaffold React + Vite + Tailwind + Zustand + React Query"
```

---

## Task 6: Auth store + API client

**Files:**
- Create: `src/store/authStore.js`
- Create: `src/api/client.js`
- Create: `src/api/auth.js`

- [ ] **Step 1: Write the failing test**

`src/tests/authStore.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import useAuthStore from '../store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
  })

  it('sets auth state', () => {
    const user = { id: '1', name: 'Test', role: 'owner' }
    useAuthStore.getState().setAuth(user, 'access123', 'refresh123')
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().accessToken).toBe('access123')
  })

  it('clears auth state', () => {
    useAuthStore.getState().setAuth({ id: '1' }, 'tok', 'ref')
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('isAuthenticated returns true when token exists', () => {
    useAuthStore.getState().setAuth({ id: '1' }, 'tok', 'ref')
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/authStore.test.js
```

Expected: FAIL — `store/authStore` not found.

- [ ] **Step 3: Create `src/store/authStore.js`**

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'pulse-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/authStore.test.js
```

Expected: 3 PASSED.

- [ ] **Step 5: Create `src/api/client.js`**

```js
import axios from 'axios'
import useAuthStore from '../store/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post('/api/v1/auth/token/refresh/', {
          refresh: refreshToken,
        })
        useAuthStore.getState().updateAccessToken(data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
```

- [ ] **Step 6: Create `src/api/auth.js`**

```js
import { useMutation } from '@tanstack/react-query'
import client from './client'
import useAuthStore from '../store/authStore'

export function useLogin() {
  return useMutation({
    mutationFn: (credentials) =>
      client.post('/auth/login/', credentials).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.access, data.refresh)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload) =>
      client.post('/auth/register/', payload).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.access, data.refresh)
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => {
      const refresh = useAuthStore.getState().refreshToken
      return client.post('/auth/logout/', { refresh })
    },
    onSettled: () => {
      useAuthStore.getState().clearAuth()
    },
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add src/store/ src/api/ src/tests/
git commit -m "feat: add Zustand auth store and Axios client with JWT interceptor"
```

---

## Task 7: App router + React Query setup

**Files:**
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/router/index.jsx`

- [ ] **Step 1: Write `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 2: Write `src/router/index.jsx`**

```jsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import AppLayout from '../components/layout/AppLayout'
import Dashboard from '../pages/dashboard/Dashboard'

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestOnly() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])

export default router
```

- [ ] **Step 3: Write `src/App.jsx`**

```jsx
import { RouterProvider } from 'react-router-dom'
import router from './router'

export default function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 4: Commit**

```bash
git add src/main.jsx src/App.jsx src/router/
git commit -m "feat: add React Router with auth guards and QueryClient setup"
```

---

## Task 8: Login page

**Files:**
- Create: `src/pages/auth/Login.jsx`
- Create: `src/tests/Login.test.jsx`

- [ ] **Step 1: Write the failing test**

`src/tests/Login.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/auth/Login'

vi.mock('../api/auth', () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}))

function wrap(ui) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Login page', () => {
  it('renders email and password fields', () => {
    wrap(<Login />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    wrap(<Login />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/Login.test.jsx
```

Expected: FAIL — `pages/auth/Login` not found.

- [ ] **Step 3: Create `src/pages/auth/Login.jsx`**

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../api/auth'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    login(form, {
      onSuccess: () => navigate('/dashboard'),
      onError: () => toast.error('Invalid email or password'),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pulse</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-60"
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New restaurant?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/Login.test.jsx
```

Expected: 2 PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/Login.jsx src/tests/Login.test.jsx
git commit -m "feat: add Login page with validation and JWT login mutation"
```

---

## Task 9: Register page

**Files:**
- Create: `src/pages/auth/Register.jsx`
- Create: `src/tests/Register.test.jsx`

- [ ] **Step 1: Write the failing test**

`src/tests/Register.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/auth/Register'

vi.mock('../api/auth', () => ({
  useRegister: () => ({ mutate: vi.fn(), isPending: false }),
}))

function wrap(ui) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>
  )
}

describe('Register page', () => {
  it('renders all required fields', () => {
    wrap(<Register />)
    expect(screen.getByPlaceholderText(/restaurant name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/Register.test.jsx
```

Expected: FAIL — `pages/auth/Register` not found.

- [ ] **Step 3: Create `src/pages/auth/Register.jsx`**

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../api/auth'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { mutate: register, isPending } = useRegister()
  const [form, setForm] = useState({
    org_name: '', name: '', email: '', password: '',
  })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.org_name) e.org_name = 'Restaurant name is required'
    if (!form.name) e.name = 'Your name is required'
    if (!form.email) e.email = 'Email is required'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    register(form, {
      onSuccess: () => {
        toast.success('Welcome to Pulse!')
        navigate('/dashboard')
      },
      onError: (err) => {
        const data = err.response?.data
        if (data?.email) toast.error(data.email[0])
        else toast.error('Registration failed. Please try again.')
      },
    })
  }

  const field = (key, placeholder, type = 'text') => (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start managing your restaurant with Pulse</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('org_name', 'Restaurant Name')}
          {field('name', 'Your Name')}
          {field('email', 'Email', 'email')}
          {field('password', 'Password (min 8 chars)', 'password')}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-60"
          >
            {isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/Register.test.jsx
```

Expected: 1 PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/Register.jsx src/tests/Register.test.jsx
git commit -m "feat: add Register page for org + owner account creation"
```

---

## Task 10: App layout + dashboard shell

**Files:**
- Create: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/TopBar.jsx`
- Create: `src/components/layout/AppLayout.jsx`
- Create: `src/pages/dashboard/Dashboard.jsx`

- [ ] **Step 1: Create `src/components/layout/Sidebar.jsx`**

```jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed,
  Package, Receipt, BarChart2, Settings, LogOut
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useLogout } from '../../api/auth'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/orders', icon: Receipt, label: 'Orders' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const roleNav = {
  kitchen: ['/pos'],
  cashier: ['/pos', '/orders', '/dashboard'],
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()

  const allowed = roleNav[user?.role]
  const items = allowed
    ? navItems.filter((i) => allowed.includes(i.to))
    : navItems

  return (
    <aside className="w-56 bg-gray-900 flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-lg">Pulse</span>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{user?.org_name}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
               ${isActive
                 ? 'bg-brand-600 text-white'
                 : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => logout(undefined, { onSettled: () => navigate('/login') })}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/TopBar.jsx`**

```jsx
import useAuthStore from '../../store/authStore'

export default function TopBar({ title }) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="text-xs">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p className="text-gray-400 capitalize">{user?.role}</p>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create `src/components/layout/AppLayout.jsx`**

```jsx
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const titles = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/orders': 'Orders',
  '/menu': 'Menu',
  '/inventory': 'Inventory',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Pulse'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/pages/dashboard/Dashboard.jsx`**

```jsx
export default function Dashboard() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', value: '—' },
          { label: 'Orders', value: '—' },
          { label: 'Avg Order', value: '—' },
          { label: 'Expenses', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run all frontend tests**

```bash
npx vitest run
```

Expected: all tests PASSED.

- [ ] **Step 6: Start dev servers and verify manually**

Terminal 1 (backend):
```bash
cd ~/Desktop/pulse-backend
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py runserver
```

Terminal 2 (frontend):
```bash
cd ~/Desktop/pulse\ frontend\ v1
npm run dev
```

Open `http://localhost:5173` — should redirect to `/login`.
Register a new restaurant — should land on dashboard with sidebar.

- [ ] **Step 7: Commit**

```bash
cd ~/Desktop/pulse\ frontend\ v1
git add src/components/ src/pages/dashboard/
git commit -m "feat: add AppLayout with sidebar, top bar, role-based nav, and dashboard shell"
```

---

## Phase 1 Complete

At this point you have:
- Django backend with PostgreSQL + Redis via Docker
- Multi-tenant Organization + Branch models
- JWT auth with role claims (owner / manager / cashier / kitchen)
- Role-based permission classes ready for all future APIs
- React frontend: Zustand auth, Axios + JWT refresh, React Query, React Router guards
- Login + Register pages
- Full app layout shell with role-aware sidebar

**Next plan:** Phase 2 — Menu Management + POS Screen + Orders API

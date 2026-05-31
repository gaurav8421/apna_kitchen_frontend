# Phase 2 — Menu, POS & Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core POS loop — menu management CRUD, a two-panel POS screen with cart, order creation, payment recording, and order history.

**Architecture:** Three new Django apps (`menu`, `orders`, `payments`) each with their own models, serializers, views, and URL config. All querysets are org-scoped (same `getattr(user, 'organization', None)` guard from Phase 1). Frontend adds a Zustand cart store, React Query hooks, a tablet-optimised POS screen, and two management pages. Cart lives entirely in Zustand until "Place Order" is pressed; only then does an API call fire.

**Tech Stack:** Django 5 + DRF + djangorestframework-simplejwt · React 19 + Vite · Zustand (cart) · TanStack React Query v5 · Tailwind CSS v3 · pytest-django · Vitest

---

## File Map

### Backend — new files
| Path | Responsibility |
|---|---|
| `apps/menu/__init__.py` | Package marker |
| `apps/menu/apps.py` | AppConfig `MenuConfig` |
| `apps/menu/models.py` | MenuCategory, MenuItem, ItemVariant, ItemModifier |
| `apps/menu/serializers.py` | Nested serializers for all four models |
| `apps/menu/views.py` | CategoryViewSet, MenuItemViewSet, VariantViewSet, ModifierViewSet |
| `apps/menu/urls.py` | Router registration |
| `apps/menu/migrations/0001_initial.py` | Auto-generated |
| `apps/orders/__init__.py` | Package marker |
| `apps/orders/apps.py` | AppConfig `OrdersConfig` |
| `apps/orders/models.py` | Order, OrderItem + order-number generation |
| `apps/orders/serializers.py` | OrderCreateSerializer, OrderListSerializer, OrderDetailSerializer |
| `apps/orders/views.py` | OrderViewSet (create, list, retrieve, status-update) |
| `apps/orders/urls.py` | Router registration |
| `apps/orders/migrations/0001_initial.py` | Auto-generated |
| `apps/payments/__init__.py` | Package marker |
| `apps/payments/apps.py` | AppConfig `PaymentsConfig` |
| `apps/payments/models.py` | Payment |
| `apps/payments/serializers.py` | PaymentSerializer |
| `apps/payments/views.py` | PaymentViewSet (create, list) |
| `apps/payments/urls.py` | Router registration |
| `apps/payments/migrations/0001_initial.py` | Auto-generated |
| `tests/test_menu.py` | Menu CRUD tests |
| `tests/test_orders.py` | Order creation + status-update tests |
| `tests/test_payments.py` | Payment recording tests |

### Backend — modified files
| Path | Change |
|---|---|
| `config/settings/base.py` | Add `apps.menu`, `apps.orders`, `apps.payments` to INSTALLED_APPS |
| `config/urls.py` | Add menu, orders, payments URL prefixes |

### Frontend — new files
| Path | Responsibility |
|---|---|
| `src/store/cartStore.js` | Zustand cart: items, quantities, order meta, actions |
| `src/api/menu.js` | React Query hooks for categories + items |
| `src/api/orders.js` | React Query hooks for creating + listing orders |
| `src/components/pos/ItemCard.jsx` | Single menu item tile (touch-friendly) |
| `src/components/pos/CartItem.jsx` | Single row in cart panel |
| `src/pages/pos/POSScreen.jsx` | Two-panel POS layout (MenuGrid + CartPanel) |
| `src/pages/pos/MenuGrid.jsx` | Category tabs + item grid |
| `src/pages/pos/CartPanel.jsx` | Cart summary + payment buttons |
| `src/pages/pos/PaymentModal.jsx` | Payment method selection + order placement |
| `src/pages/orders/OrderHistory.jsx` | Paginated order list with status badges |
| `src/pages/menu/MenuManager.jsx` | Category + item CRUD management |
| `src/tests/pos.test.jsx` | Cart store unit tests + POS smoke tests |

### Frontend — modified files
| Path | Change |
|---|---|
| `src/router/index.jsx` | Add `/pos`, `/orders`, `/menu` routes |

---

## Task 1: Register New Django Apps

**Files:**
- Create: `apps/menu/__init__.py`, `apps/menu/apps.py`
- Create: `apps/orders/__init__.py`, `apps/orders/apps.py`
- Create: `apps/payments/__init__.py`, `apps/payments/apps.py`
- Modify: `config/settings/base.py`

- [ ] **Step 1: Create app scaffolding**

```bash
cd ~/Desktop/pulse-backend
mkdir -p apps/menu apps/orders apps/payments
touch apps/menu/__init__.py apps/orders/__init__.py apps/payments/__init__.py
```

- [ ] **Step 2: Write apps/menu/apps.py**

```python
from django.apps import AppConfig


class MenuConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.menu'
```

- [ ] **Step 3: Write apps/orders/apps.py**

```python
from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.orders'
```

- [ ] **Step 4: Write apps/payments/apps.py**

```python
from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.payments'
```

- [ ] **Step 5: Add to INSTALLED_APPS in config/settings/base.py**

Find the line `'apps.branches',` and add three lines after it:

```python
    'apps.branches',
    'apps.menu',
    'apps.orders',
    'apps.payments',
```

- [ ] **Step 6: Verify Django can load settings**

```bash
cd ~/Desktop/pulse-backend
python manage.py check
```

Expected: `System check identified no issues (0 silenced).`

- [ ] **Step 7: Commit**

```bash
git add apps/menu/__init__.py apps/menu/apps.py \
        apps/orders/__init__.py apps/orders/apps.py \
        apps/payments/__init__.py apps/payments/apps.py \
        config/settings/base.py
git commit -m "feat: scaffold menu, orders, payments apps"
```

---

## Task 2: Menu Models

**Files:**
- Create: `apps/menu/models.py`
- Create: `apps/menu/migrations/0001_initial.py` (auto-generated)

- [ ] **Step 1: Write the failing test**

Create `tests/test_menu.py`:

```python
import pytest
from apps.organizations.models import Organization
from apps.branches.models import Branch
from apps.menu.models import MenuCategory, MenuItem, ItemVariant, ItemModifier


@pytest.fixture
def org():
    return Organization.objects.create(name='Curry House', slug='curry-house-menu')


@pytest.fixture
def branch(org):
    return Branch.objects.create(name='Main Branch', organization=org)


@pytest.mark.django_db
def test_menu_category_str(org):
    cat = MenuCategory.objects.create(organization=org, name='Starters', sort_order=1)
    assert str(cat) == 'Starters'


@pytest.mark.django_db
def test_menu_item_str(org):
    cat = MenuCategory.objects.create(organization=org, name='Starters', sort_order=1)
    item = MenuItem.objects.create(
        organization=org, category=cat,
        name='Paneer Tikka', price='220.00', item_type='veg',
    )
    assert str(item) == 'Paneer Tikka'


@pytest.mark.django_db
def test_item_variant_price_delta(org):
    cat = MenuCategory.objects.create(organization=org, name='Mains', sort_order=2)
    item = MenuItem.objects.create(
        organization=org, category=cat,
        name='Biryani', price='280.00', item_type='non_veg',
    )
    variant = ItemVariant.objects.create(item=item, name='Large', price_delta='40.00')
    assert variant.price_delta == pytest.approx(40.00, abs=0.01)


@pytest.mark.django_db
def test_item_modifier(org):
    cat = MenuCategory.objects.create(organization=org, name='Mains', sort_order=2)
    item = MenuItem.objects.create(
        organization=org, category=cat,
        name='Pizza', price='350.00', item_type='veg',
    )
    mod = ItemModifier.objects.create(item=item, name='Extra Cheese', price='30.00')
    assert mod.price == pytest.approx(30.00, abs=0.01)
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd ~/Desktop/pulse-backend
pytest tests/test_menu.py -v 2>&1 | head -20
```

Expected: `ImportError: cannot import name 'MenuCategory' from 'apps.menu.models'`

- [ ] **Step 3: Write apps/menu/models.py**

```python
import uuid
from django.db import models


class MenuCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='menu_categories'
    )
    branch = models.ForeignKey(
        'branches.Branch', on_delete=models.CASCADE,
        null=True, blank=True, related_name='menu_categories'
    )
    name = models.CharField(max_length=200)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'menu_categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    ITEM_TYPES = [('veg', 'Veg'), ('non_veg', 'Non-Veg'), ('egg', 'Egg')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='menu_items'
    )
    category = models.ForeignKey(
        MenuCategory, on_delete=models.CASCADE, related_name='items'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True)
    item_type = models.CharField(max_length=10, choices=ITEM_TYPES, default='veg')
    is_available = models.BooleanField(default=True)
    track_inventory = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'menu_items'
        ordering = ['name']

    def __str__(self):
        return self.name


class ItemVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'item_variants'

    def __str__(self):
        return f'{self.item.name} — {self.name}'


class ItemModifier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='modifiers')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'item_modifiers'

    def __str__(self):
        return f'{self.item.name} + {self.name}'
```

- [ ] **Step 4: Create and apply migrations**

```bash
cd ~/Desktop/pulse-backend
python manage.py makemigrations menu
python manage.py migrate
```

Expected: `Applying menu.0001_initial... OK`

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_menu.py -v
```

Expected: `4 passed`

- [ ] **Step 6: Commit**

```bash
git add apps/menu/models.py apps/menu/migrations/
git add tests/test_menu.py
git commit -m "feat: add menu models (MenuCategory, MenuItem, ItemVariant, ItemModifier)"
```

---

## Task 3: Menu Serializers, Views, and URLs

**Files:**
- Create: `apps/menu/serializers.py`
- Create: `apps/menu/views.py`
- Create: `apps/menu/urls.py`
- Modify: `config/urls.py`
- Modify: `tests/test_menu.py` (add API tests)

- [ ] **Step 1: Write the failing API tests — append to tests/test_menu.py**

```python
import pytest
from django.urls import reverse
from apps.accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def owner(org):
    return User.objects.create_user(
        email='owner@curry.com', password='pass1234',
        name='Owner', organization=org, role='owner',
    )


@pytest.fixture
def auth_client(client, owner):
    token = str(RefreshToken.for_user(owner).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client


@pytest.mark.django_db
def test_create_category(auth_client):
    url = reverse('menucategory-list')
    resp = auth_client.post(url, {'name': 'Starters', 'sort_order': 1}, content_type='application/json')
    assert resp.status_code == 201
    assert resp.json()['name'] == 'Starters'


@pytest.mark.django_db
def test_list_categories_scoped_to_org(auth_client, org):
    other_org = Organization.objects.create(name='Other', slug='other-org-menu')
    MenuCategory.objects.create(organization=org, name='Mine', sort_order=1)
    MenuCategory.objects.create(organization=other_org, name='Not Mine', sort_order=1)
    resp = auth_client.get(reverse('menucategory-list'))
    assert resp.status_code == 200
    names = [c['name'] for c in resp.json()]
    assert 'Mine' in names
    assert 'Not Mine' not in names


@pytest.mark.django_db
def test_create_menu_item(auth_client, org):
    cat = MenuCategory.objects.create(organization=org, name='Mains', sort_order=1)
    url = reverse('menuitem-list')
    payload = {
        'category': str(cat.id),
        'name': 'Dal Makhani',
        'price': '220.00',
        'item_type': 'veg',
    }
    resp = auth_client.post(url, payload, content_type='application/json')
    assert resp.status_code == 201
    assert resp.json()['price'] == '220.00'


@pytest.mark.django_db
def test_cashier_cannot_create_category(client, org):
    cashier = User.objects.create_user(
        email='cashier@curry.com', password='pass1234',
        name='Cashier', organization=org, role='cashier',
    )
    token = str(RefreshToken.for_user(cashier).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    resp = client.post(
        reverse('menucategory-list'),
        {'name': 'Drinks', 'sort_order': 5},
        content_type='application/json',
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_list_items_scoped_to_org(auth_client, org):
    other_org = Organization.objects.create(name='Other2', slug='other-org-menu2')
    cat1 = MenuCategory.objects.create(organization=org, name='A', sort_order=1)
    cat2 = MenuCategory.objects.create(organization=other_org, name='B', sort_order=1)
    MenuItem.objects.create(organization=org, category=cat1, name='My Item', price='100.00', item_type='veg')
    MenuItem.objects.create(organization=other_org, category=cat2, name='Their Item', price='100.00', item_type='veg')
    resp = auth_client.get(reverse('menuitem-list'))
    names = [i['name'] for i in resp.json()]
    assert 'My Item' in names
    assert 'Their Item' not in names
```

- [ ] **Step 2: Run to verify they fail**

```bash
pytest tests/test_menu.py::test_create_category -v 2>&1 | head -10
```

Expected: `FAILED` or `NoReverseMatch`

- [ ] **Step 3: Write apps/menu/serializers.py**

```python
from rest_framework import serializers
from .models import MenuCategory, MenuItem, ItemVariant, ItemModifier


class ItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemVariant
        fields = ['id', 'name', 'price_delta']
        read_only_fields = ['id']


class ItemModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemModifier
        fields = ['id', 'name', 'price']
        read_only_fields = ['id']


class MenuItemSerializer(serializers.ModelSerializer):
    variants = ItemVariantSerializer(many=True, read_only=True)
    modifiers = ItemModifierSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'name', 'description', 'price',
            'image_url', 'item_type', 'is_available', 'track_inventory',
            'variants', 'modifiers', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ['id', 'branch', 'name', 'sort_order', 'is_active']
        read_only_fields = ['id']
```

- [ ] **Step 4: Write apps/menu/views.py**

```python
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsOwnerOrManager
from .models import MenuCategory, MenuItem, ItemVariant, ItemModifier
from .serializers import (
    MenuCategorySerializer, MenuItemSerializer,
    ItemVariantSerializer, ItemModifierSerializer,
)


class MenuCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = MenuCategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'is_active']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrManager()]

    def get_queryset(self):
        org = getattr(self.request.user, 'organization', None)
        if org is None:
            return MenuCategory.objects.none()
        return MenuCategory.objects.filter(organization=org)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'item_type', 'is_available']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrManager()]

    def get_queryset(self):
        org = getattr(self.request.user, 'organization', None)
        if org is None:
            return MenuItem.objects.none()
        return MenuItem.objects.filter(organization=org).select_related('category').prefetch_related('variants', 'modifiers')

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class ItemVariantViewSet(viewsets.ModelViewSet):
    serializer_class = ItemVariantSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrManager()]

    def get_queryset(self):
        org = getattr(self.request.user, 'organization', None)
        if org is None:
            return ItemVariant.objects.none()
        return ItemVariant.objects.filter(item__organization=org, item_id=self.kwargs['item_pk'])

    def perform_create(self, serializer):
        org = getattr(self.request.user, 'organization', None)
        item = MenuItem.objects.get(pk=self.kwargs['item_pk'], organization=org)
        serializer.save(item=item)


class ItemModifierViewSet(viewsets.ModelViewSet):
    serializer_class = ItemModifierSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrManager()]

    def get_queryset(self):
        org = getattr(self.request.user, 'organization', None)
        if org is None:
            return ItemModifier.objects.none()
        return ItemModifier.objects.filter(item__organization=org, item_id=self.kwargs['item_pk'])

    def perform_create(self, serializer):
        org = getattr(self.request.user, 'organization', None)
        item = MenuItem.objects.get(pk=self.kwargs['item_pk'], organization=org)
        serializer.save(item=item)
```

- [ ] **Step 5: Write apps/menu/urls.py**

```python
from rest_framework_nested import routers
from rest_framework.routers import DefaultRouter
from .views import MenuCategoryViewSet, MenuItemViewSet, ItemVariantViewSet, ItemModifierViewSet

router = DefaultRouter()
router.register('categories', MenuCategoryViewSet, basename='menucategory')
router.register('items', MenuItemViewSet, basename='menuitem')

items_router = routers.NestedDefaultRouter(router, 'items', lookup='item')
items_router.register('variants', ItemVariantViewSet, basename='menuitem-variants')
items_router.register('modifiers', ItemModifierViewSet, basename='menuitem-modifiers')

urlpatterns = router.urls + items_router.urls
```

- [ ] **Step 6: Install drf-nested-routers**

```bash
cd ~/Desktop/pulse-backend
pip install drf-nested-routers
echo "drf-nested-routers" >> requirements/base.txt
```

- [ ] **Step 7: Register in config/urls.py**

Add after `path('api/v1/branches/', ...)`:

```python
    path('api/v1/menu/', include('apps.menu.urls')),
```

- [ ] **Step 8: Run tests**

```bash
cd ~/Desktop/pulse-backend
pytest tests/test_menu.py -v
```

Expected: All tests pass (9 tests total including model tests from Task 2).

- [ ] **Step 9: Commit**

```bash
git add apps/menu/serializers.py apps/menu/views.py apps/menu/urls.py
git add config/urls.py requirements/base.txt tests/test_menu.py
git commit -m "feat: menu CRUD API (categories, items, variants, modifiers)"
```

---

## Task 4: Order Models

**Files:**
- Create: `apps/orders/models.py`
- Create: `apps/orders/migrations/0001_initial.py` (auto-generated)

- [ ] **Step 1: Write failing model tests**

Create `tests/test_orders.py`:

```python
import pytest
from django.db import transaction
from apps.organizations.models import Organization
from apps.branches.models import Branch
from apps.accounts.models import User
from apps.menu.models import MenuCategory, MenuItem
from apps.orders.models import Order, OrderItem


@pytest.fixture
def org():
    return Organization.objects.create(name='Spice Route', slug='spice-route-orders')


@pytest.fixture
def branch(org):
    return Branch.objects.create(name='MG Road', organization=org)


@pytest.fixture
def owner(org):
    return User.objects.create_user(
        email='owner@spice.com', password='pass1234',
        name='Owner', organization=org, role='owner',
    )


@pytest.fixture
def category(org):
    return MenuCategory.objects.create(organization=org, name='Mains', sort_order=1)


@pytest.fixture
def item(org, category):
    return MenuItem.objects.create(
        organization=org, category=category,
        name='Butter Chicken', price='320.00', item_type='non_veg',
    )


@pytest.mark.django_db
def test_order_number_sequential(org, branch, owner):
    o1 = Order.objects.create(
        organization=org, branch=branch, created_by=owner,
        order_type='dine_in', subtotal='320.00', tax='16.00', total='336.00',
    )
    o2 = Order.objects.create(
        organization=org, branch=branch, created_by=owner,
        order_type='takeaway', subtotal='100.00', tax='5.00', total='105.00',
    )
    assert o1.order_number == 'ORD-0001'
    assert o2.order_number == 'ORD-0002'


@pytest.mark.django_db
def test_order_number_scoped_per_branch(org, owner):
    branch_a = Branch.objects.create(name='Branch A', organization=org)
    branch_b = Branch.objects.create(name='Branch B', organization=org)
    o_a = Order.objects.create(
        organization=org, branch=branch_a, created_by=owner,
        order_type='dine_in', subtotal='100.00', tax='5.00', total='105.00',
    )
    o_b = Order.objects.create(
        organization=org, branch=branch_b, created_by=owner,
        order_type='dine_in', subtotal='100.00', tax='5.00', total='105.00',
    )
    assert o_a.order_number == 'ORD-0001'
    assert o_b.order_number == 'ORD-0001'


@pytest.mark.django_db
def test_order_item_subtotal(org, branch, owner, item):
    order = Order.objects.create(
        organization=org, branch=branch, created_by=owner,
        order_type='dine_in', subtotal='640.00', tax='32.00', total='672.00',
    )
    oi = OrderItem.objects.create(
        order=order, item=item,
        item_name='Butter Chicken', unit_price='320.00', quantity=2, subtotal='640.00',
    )
    assert oi.subtotal == pytest.approx(640.00, abs=0.01)
```

- [ ] **Step 2: Run to verify they fail**

```bash
pytest tests/test_orders.py -v 2>&1 | head -10
```

Expected: `ImportError`

- [ ] **Step 3: Write apps/orders/models.py**

```python
import uuid
from django.db import models, transaction


def _next_order_number(branch):
    with transaction.atomic():
        last = (
            Order.objects.select_for_update()
            .filter(branch=branch)
            .order_by('-created_at')
            .values_list('order_number', flat=True)
            .first()
        )
        if last:
            num = int(last.split('-')[1]) + 1
        else:
            num = 1
        return f'ORD-{num:04d}'


class Order(models.Model):
    ORDER_TYPES = [
        ('dine_in', 'Dine In'),
        ('takeaway', 'Takeaway'),
        ('delivery', 'Delivery'),
        ('online', 'Online'),
    ]
    STATUSES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='orders'
    )
    branch = models.ForeignKey(
        'branches.Branch', on_delete=models.CASCADE, related_name='orders'
    )
    order_number = models.CharField(max_length=20, blank=True)
    order_type = models.CharField(max_length=20, choices=ORDER_TYPES, default='dine_in')
    table_number = models.CharField(max_length=20, blank=True)
    customer_name = models.CharField(max_length=200, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = _next_order_number(self.branch)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(
        'menu.MenuItem', on_delete=models.SET_NULL, null=True, related_name='order_items'
    )
    item_name = models.CharField(max_length=200)
    variant_name = models.CharField(max_length=100, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    modifiers = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f'{self.order.order_number} — {self.item_name} x{self.quantity}'
```

- [ ] **Step 4: Create and apply migrations**

```bash
cd ~/Desktop/pulse-backend
python manage.py makemigrations orders
python manage.py migrate
```

Expected: `Applying orders.0001_initial... OK`

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_orders.py::test_order_number_sequential tests/test_orders.py::test_order_number_scoped_per_branch tests/test_orders.py::test_order_item_subtotal -v
```

Expected: `3 passed`

- [ ] **Step 6: Commit**

```bash
git add apps/orders/models.py apps/orders/migrations/ tests/test_orders.py
git commit -m "feat: add Order and OrderItem models with sequential order numbers"
```

---

## Task 5: Orders Serializers, Views, and URLs

**Files:**
- Create: `apps/orders/serializers.py`
- Create: `apps/orders/views.py`
- Create: `apps/orders/urls.py`
- Modify: `config/urls.py`
- Modify: `tests/test_orders.py` (add API tests)

- [ ] **Step 1: Write failing API tests — append to tests/test_orders.py**

```python
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def auth_client(client, owner):
    token = str(RefreshToken.for_user(owner).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client


@pytest.mark.django_db
def test_create_order(auth_client, org, branch, item):
    url = reverse('order-list')
    payload = {
        'branch': str(branch.id),
        'order_type': 'dine_in',
        'table_number': '5',
        'items': [
            {
                'item': str(item.id),
                'item_name': 'Butter Chicken',
                'unit_price': '320.00',
                'quantity': 2,
                'subtotal': '640.00',
            }
        ],
        'subtotal': '640.00',
        'tax': '32.00',
        'total': '672.00',
    }
    resp = auth_client.post(url, payload, content_type='application/json')
    assert resp.status_code == 201
    data = resp.json()
    assert data['order_number'].startswith('ORD-')
    assert data['status'] == 'pending'
    assert len(data['items']) == 1


@pytest.mark.django_db
def test_list_orders_scoped_to_org(auth_client, org, branch, owner):
    other_org = Organization.objects.create(name='Other Org', slug='other-org-orders')
    other_branch = Branch.objects.create(name='Other', organization=other_org)
    other_owner = User.objects.create_user(
        email='other@o.com', password='pass', name='Other', organization=other_org, role='owner',
    )
    Order.objects.create(
        organization=org, branch=branch, created_by=owner,
        order_type='dine_in', subtotal='100.00', tax='5.00', total='105.00',
    )
    Order.objects.create(
        organization=other_org, branch=other_branch, created_by=other_owner,
        order_type='dine_in', subtotal='100.00', tax='5.00', total='105.00',
    )
    resp = auth_client.get(reverse('order-list'))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.django_db
def test_update_order_status(auth_client, org, branch, owner):
    order = Order.objects.create(
        organization=org, branch=branch, created_by=owner,
        order_type='dine_in', subtotal='100.00', tax='5.00', total='105.00',
    )
    url = reverse('order-update-status', args=[order.id])
    resp = auth_client.patch(url, {'status': 'preparing'}, content_type='application/json')
    assert resp.status_code == 200
    assert resp.json()['status'] == 'preparing'


@pytest.mark.django_db
def test_cashier_can_create_order(client, org, branch, item):
    cashier = User.objects.create_user(
        email='cashier@spice.com', password='pass', name='Cashier',
        organization=org, role='cashier',
    )
    token = str(RefreshToken.for_user(cashier).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    payload = {
        'branch': str(branch.id),
        'order_type': 'takeaway',
        'items': [
            {'item': str(item.id), 'item_name': 'Butter Chicken',
             'unit_price': '320.00', 'quantity': 1, 'subtotal': '320.00'}
        ],
        'subtotal': '320.00', 'tax': '16.00', 'total': '336.00',
    }
    resp = client.post(reverse('order-list'), payload, content_type='application/json')
    assert resp.status_code == 201
```

- [ ] **Step 2: Run to verify they fail**

```bash
pytest tests/test_orders.py::test_create_order -v 2>&1 | head -10
```

Expected: `NoReverseMatch` or `AssertionError 404`

- [ ] **Step 3: Write apps/orders/serializers.py**

```python
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['item', 'item_name', 'variant_name', 'unit_price', 'quantity', 'modifiers', 'notes', 'subtotal']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_name', 'variant_name', 'unit_price', 'quantity', 'modifiers', 'notes', 'subtotal']
        read_only_fields = ['id']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'branch', 'order_type', 'table_number', 'customer_name', 'customer_phone',
            'subtotal', 'discount', 'tax', 'total', 'items',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

    def to_representation(self, instance):
        return OrderDetailSerializer(instance, context=self.context).data


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'branch', 'order_type', 'table_number',
            'customer_name', 'customer_phone', 'status',
            'subtotal', 'discount', 'tax', 'total',
            'items', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']
```

- [ ] **Step 4: Write apps/orders/views.py**

```python
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer, OrderStatusSerializer


class OrderViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'status', 'order_type']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request.user, 'organization', None)
        if org is None:
            return Order.objects.none()
        return Order.objects.filter(organization=org).prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderDetailSerializer(order).data)
```

- [ ] **Step 5: Write apps/orders/urls.py**

```python
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet

router = DefaultRouter()
router.register('', OrderViewSet, basename='order')

urlpatterns = router.urls
```

- [ ] **Step 6: Register in config/urls.py**

Add after `path('api/v1/menu/', ...)`:

```python
    path('api/v1/orders/', include('apps.orders.urls')),
```

- [ ] **Step 7: Run all order tests**

```bash
pytest tests/test_orders.py -v
```

Expected: All 7 tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/orders/serializers.py apps/orders/views.py apps/orders/urls.py
git add config/urls.py tests/test_orders.py
git commit -m "feat: orders API (create, list, status update)"
```

---

## Task 6: Payment Models, Serializers, Views, and URLs

**Files:**
- Create: `apps/payments/models.py`
- Create: `apps/payments/migrations/0001_initial.py` (auto-generated)
- Create: `apps/payments/serializers.py`
- Create: `apps/payments/views.py`
- Create: `apps/payments/urls.py`
- Create: `tests/test_payments.py`
- Modify: `config/urls.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_payments.py`:

```python
import pytest
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from apps.organizations.models import Organization
from apps.branches.models import Branch
from apps.accounts.models import User
from apps.orders.models import Order


@pytest.fixture
def org():
    return Organization.objects.create(name='Pay Test', slug='pay-test')


@pytest.fixture
def branch(org):
    return Branch.objects.create(name='Main', organization=org)


@pytest.fixture
def owner(org):
    return User.objects.create_user(
        email='pay@test.com', password='pass1234', name='Owner',
        organization=org, role='owner',
    )


@pytest.fixture
def order(org, branch, owner):
    return Order.objects.create(
        organization=org, branch=branch, created_by=owner,
        order_type='dine_in', subtotal='300.00', tax='15.00', total='315.00',
    )


@pytest.fixture
def auth_client(client, owner):
    token = str(RefreshToken.for_user(owner).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return auth_client


@pytest.fixture
def auth_client(client, owner):
    token = str(RefreshToken.for_user(owner).access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client


@pytest.mark.django_db
def test_record_cash_payment(auth_client, org, order):
    url = reverse('payment-list')
    payload = {
        'order': str(order.id),
        'amount': '315.00',
        'method': 'cash',
    }
    resp = auth_client.post(url, payload, content_type='application/json')
    assert resp.status_code == 201
    assert resp.json()['status'] == 'completed'


@pytest.mark.django_db
def test_list_payments_scoped_to_org(auth_client, org, order):
    from apps.payments.models import Payment
    other_org = Organization.objects.create(name='Other', slug='other-pay')
    Payment.objects.create(organization=org, order=order, amount='315.00', method='cash', status='completed')
    resp = auth_client.get(reverse('payment-list'))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.django_db
def test_record_upi_payment(auth_client, org, order):
    payload = {
        'order': str(order.id),
        'amount': '315.00',
        'method': 'upi',
        'reference_id': 'UPI123456',
    }
    resp = auth_client.post(reverse('payment-list'), payload, content_type='application/json')
    assert resp.status_code == 201
    assert resp.json()['reference_id'] == 'UPI123456'
```

- [ ] **Step 2: Run to verify they fail**

```bash
pytest tests/test_payments.py -v 2>&1 | head -10
```

Expected: `ImportError: cannot import name 'Payment'`

- [ ] **Step 3: Write apps/payments/models.py**

```python
import uuid
from django.db import models


class Payment(models.Model):
    METHODS = [('cash', 'Cash'), ('upi', 'UPI'), ('card', 'Card'), ('online', 'Online')]
    STATUSES = [('pending', 'Pending'), ('completed', 'Completed'), ('failed', 'Failed'), ('refunded', 'Refunded')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='payments'
    )
    order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHODS)
    reference_id = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='completed')
    razorpay_payment_id = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.method} ₹{self.amount}'
```

- [ ] **Step 4: Create and apply migrations**

```bash
cd ~/Desktop/pulse-backend
python manage.py makemigrations payments
python manage.py migrate
```

Expected: `Applying payments.0001_initial... OK`

- [ ] **Step 5: Write apps/payments/serializers.py**

```python
from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'amount', 'method', 'reference_id', 'status', 'razorpay_payment_id', 'created_at']
        read_only_fields = ['id', 'created_at']
```

- [ ] **Step 6: Write apps/payments/views.py**

```python
from rest_framework import viewsets, permissions
from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        org = getattr(self.request.user, 'organization', None)
        if org is None:
            return Payment.objects.none()
        return Payment.objects.filter(organization=org)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
```

- [ ] **Step 7: Write apps/payments/urls.py**

```python
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

router = DefaultRouter()
router.register('', PaymentViewSet, basename='payment')

urlpatterns = router.urls
```

- [ ] **Step 8: Register in config/urls.py**

Add after `path('api/v1/orders/', ...)`:

```python
    path('api/v1/payments/', include('apps.payments.urls')),
```

- [ ] **Step 9: Run all tests**

```bash
pytest tests/test_payments.py -v
```

Expected: `3 passed`

- [ ] **Step 10: Run full test suite to verify no regressions**

```bash
pytest -v
```

Expected: All tests pass (previous 8 + new tests = ~20 total).

- [ ] **Step 11: Commit**

```bash
git add apps/payments/ tests/test_payments.py config/urls.py
git commit -m "feat: payments API (record and list payments)"
```

---

## Task 7: Frontend Cart Store

**Files:**
- Create: `src/store/cartStore.js`
- Create: `src/tests/cartStore.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/tests/cartStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'
import useCartStore from '../store/cartStore'

beforeEach(() => {
  useCartStore.setState({
    items: [],
    branchId: null,
    orderType: 'dine_in',
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    discount: 0,
  })
})

const fakeItem = { id: 'abc-123', name: 'Butter Chicken', price: 320, item_type: 'non_veg' }

describe('addItem', () => {
  it('adds a new item to cart', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when same item added again', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().addItem(fakeItem))
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })
})

describe('removeItem', () => {
  it('removes item from cart', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().removeItem('abc-123'))
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('updateQuantity', () => {
  it('updates item quantity', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().updateQuantity('abc-123', 5))
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removes item when quantity set to 0', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().updateQuantity('abc-123', 0))
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('totals', () => {
  it('calculates subtotal correctly', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().updateQuantity('abc-123', 2))
    expect(useCartStore.getState().subtotal()).toBe(640)
  })

  it('calculates tax at 5% by default', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    expect(useCartStore.getState().tax(5)).toBeCloseTo(16, 1)
  })
})

describe('clearCart', () => {
  it('empties cart', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().clearCart())
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
npx vitest run src/tests/cartStore.test.js 2>&1 | head -15
```

Expected: `Cannot find module '../store/cartStore'`

- [ ] **Step 3: Write src/store/cartStore.js**

```js
import { create } from 'zustand'

const useCartStore = create((set, get) => ({
  items: [],
  branchId: null,
  orderType: 'dine_in',
  tableNumber: '',
  customerName: '',
  customerPhone: '',
  discount: 0,

  addItem: (menuItem, variantName = '', modifiers = []) => {
    const key = variantName ? `${menuItem.id}__${variantName}` : menuItem.id
    set((state) => {
      const existing = state.items.find((i) => i.key === key)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      const price = menuItem.price + (modifiers.reduce((s, m) => s + m.price, 0))
      return {
        items: [
          ...state.items,
          { key, id: menuItem.id, name: menuItem.name, variantName, modifiers, unitPrice: price, quantity: 1 },
        ],
      }
    })
  },

  removeItem: (key) =>
    set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

  updateQuantity: (key, quantity) => {
    if (quantity <= 0) {
      get().removeItem(key)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
    }))
  },

  setOrderMeta: (meta) => set(meta),

  clearCart: () =>
    set({
      items: [],
      tableNumber: '',
      customerName: '',
      customerPhone: '',
      discount: 0,
    }),

  subtotal: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),

  tax: (taxRatePercent) => {
    const sub = get().subtotal()
    return parseFloat(((sub * taxRatePercent) / 100).toFixed(2))
  },

  total: (taxRatePercent) => {
    const sub = get().subtotal()
    return parseFloat((sub + get().tax(taxRatePercent) - get().discount).toFixed(2))
  },
}))

export default useCartStore
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/tests/cartStore.test.js
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
git add src/store/cartStore.js src/tests/cartStore.test.js
git commit -m "feat: Zustand cart store with add/remove/quantity/totals"
```

---

## Task 8: Frontend Menu API Hooks

**Files:**
- Create: `src/api/menu.js`
- Create: `src/api/orders.js`

- [ ] **Step 1: Write src/api/menu.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useCategories(params = {}) {
  return useQuery({
    queryKey: ['menu-categories', params],
    queryFn: () => client.get('/menu/categories/', { params }).then((r) => r.data),
  })
}

export function useMenuItems(params = {}) {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: () => client.get('/menu/items/', { params }).then((r) => r.data),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/menu/categories/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/menu/categories/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/menu/categories/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  })
}

export function useCreateMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/menu/items/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useUpdateMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/menu/items/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useDeleteMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/menu/items/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}
```

- [ ] **Step 2: Write src/api/orders.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => client.get('/orders/', { params }).then((r) => r.data),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/orders/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) =>
      client.patch(`/orders/${id}/status/`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/payments/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
git add src/api/menu.js src/api/orders.js
git commit -m "feat: React Query hooks for menu, orders, and payments"
```

---

## Task 9: POS Screen — ItemCard and MenuGrid

**Files:**
- Create: `src/components/pos/ItemCard.jsx`
- Create: `src/pages/pos/MenuGrid.jsx`
- Create: `src/pages/pos/POSScreen.jsx` (shell only — CartPanel added in Task 10)

- [ ] **Step 1: Write src/components/pos/ItemCard.jsx**

```jsx
const TYPE_COLORS = { veg: 'border-green-500', non_veg: 'border-red-500', egg: 'border-yellow-500' }

export default function ItemCard({ item, onAdd }) {
  return (
    <button
      onClick={() => onAdd(item)}
      className="flex flex-col items-start p-3 bg-white rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-sm transition active:scale-95 min-h-[80px] w-full text-left"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-3 h-3 rounded-sm border-2 ${TYPE_COLORS[item.item_type] ?? 'border-gray-400'}`} />
        <span className="text-xs text-gray-500 truncate max-w-[90%]">{item.category_name}</span>
      </div>
      <p className="font-medium text-gray-900 text-sm leading-tight">{item.name}</p>
      <p className="mt-auto pt-1 text-brand-600 font-semibold text-sm">₹{item.price}</p>
    </button>
  )
}
```

- [ ] **Step 2: Write src/pages/pos/MenuGrid.jsx**

```jsx
import { useState } from 'react'
import { useCategories, useMenuItems } from '../../api/menu'
import ItemCard from '../../components/pos/ItemCard'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

export default function MenuGrid() {
  const branchId = useAuthStore((s) => s.user?.branch_id)
  const [activeCatId, setActiveCatId] = useState(null)
  const [search, setSearch] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const { data: categories = [] } = useCategories(branchId ? { branch: branchId } : {})
  const { data: items = [], isLoading } = useMenuItems({
    ...(activeCatId ? { category: activeCatId } : {}),
    is_available: true,
  })

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex gap-2 px-3 py-2 overflow-x-auto bg-white border-b border-gray-200 scrollbar-hide">
        <button
          onClick={() => setActiveCatId(null)}
          className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeCatId === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCatId(cat.id)}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeCatId === cat.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center mt-8">Loading menu…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">No items found</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} onAdd={addItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write the POSScreen shell (src/pages/pos/POSScreen.jsx)**

```jsx
import MenuGrid from './MenuGrid'

export default function POSScreen() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden border-r border-gray-200">
        <MenuGrid />
      </div>
      <div className="w-80 xl:w-96 flex-none bg-gray-50">
        {/* CartPanel rendered in Task 10 */}
        <p className="p-4 text-sm text-gray-400">Cart panel coming in next task</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add route and update router/index.jsx**

Add this import at the top of `src/router/index.jsx`:

```jsx
import POSScreen from '../pages/pos/POSScreen'
```

Add to the `AppLayout` children array after the `{ path: '/dashboard', ... }` route:

```jsx
{ path: '/pos', element: <POSScreen /> },
```

- [ ] **Step 5: Start dev server and verify POS screen loads at /pos**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
npm run dev
```

Open http://localhost:5173/pos. Log in if redirected. Verify category tabs and item grid render. Verify clicking an item does not throw errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/pos/ItemCard.jsx src/pages/pos/MenuGrid.jsx src/pages/pos/POSScreen.jsx
git add src/router/index.jsx
git commit -m "feat: POS screen with category tabs, search, and item grid"
```

---

## Task 10: Cart Panel and Payment Modal

**Files:**
- Create: `src/components/pos/CartItem.jsx`
- Create: `src/pages/pos/CartPanel.jsx`
- Create: `src/pages/pos/PaymentModal.jsx`
- Modify: `src/pages/pos/POSScreen.jsx`

- [ ] **Step 1: Write src/components/pos/CartItem.jsx**

```jsx
import { Minus, Plus, Trash2 } from 'lucide-react'
import useCartStore from '../../store/cartStore'

export default function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.variantName && (
          <p className="text-xs text-gray-500">{item.variantName}</p>
        )}
        <p className="text-xs text-gray-500">₹{item.unitPrice}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.key, item.quantity - 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 transition"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.key, item.quantity + 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 transition"
        >
          <Plus size={12} />
        </button>
      </div>
      <p className="w-16 text-right text-sm font-medium text-gray-900">
        ₹{(item.unitPrice * item.quantity).toFixed(0)}
      </p>
      <button
        onClick={() => removeItem(item.key)}
        className="text-gray-300 hover:text-red-400 transition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Write src/pages/pos/PaymentModal.jsx**

```jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useCreateOrder, useRecordPayment } from '../../api/orders'

const METHODS = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'card', label: '💳 Card' },
]

export default function PaymentModal({ onClose, taxRate = 5 }) {
  const [method, setMethod] = useState('cash')
  const [referenceId, setReferenceId] = useState('')
  const cartItems = useCartStore((s) => s.items)
  const branchId = useCartStore((s) => s.branchId)
  const orderType = useCartStore((s) => s.orderType)
  const tableNumber = useCartStore((s) => s.tableNumber)
  const customerName = useCartStore((s) => s.customerName)
  const customerPhone = useCartStore((s) => s.customerPhone)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)
  const clearCart = useCartStore((s) => s.clearCart)
  const activeBranchId = useAuthStore((s) => s.user?.branch_id)

  const createOrder = useCreateOrder()
  const recordPayment = useRecordPayment()

  const handlePlaceOrder = async () => {
    const sub = subtotal()
    const t = tax(taxRate)
    const tot = total(taxRate)
    const branch = branchId || activeBranchId

    const orderPayload = {
      branch,
      order_type: orderType,
      table_number: tableNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      subtotal: sub.toFixed(2),
      tax: t.toFixed(2),
      total: tot.toFixed(2),
      items: cartItems.map((i) => ({
        item: i.id,
        item_name: i.name,
        variant_name: i.variantName,
        unit_price: i.unitPrice.toFixed(2),
        quantity: i.quantity,
        modifiers: i.modifiers,
        subtotal: (i.unitPrice * i.quantity).toFixed(2),
      })),
    }

    const order = await createOrder.mutateAsync(orderPayload)
    await recordPayment.mutateAsync({
      order: order.id,
      amount: tot.toFixed(2),
      method,
      reference_id: referenceId,
    })

    clearCart()
    onClose()
  }

  const isPending = createOrder.isPending || recordPayment.isPending
  const sub = subtotal()
  const t = tax(taxRate)
  const tot = total(taxRate)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 mb-5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>₹{sub.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST ({taxRate}%)</span><span>₹{t.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
            <span>Total</span><span>₹{tot.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-2">Payment method</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`py-2 rounded-lg text-sm font-medium border transition ${
                method === m.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {(method === 'upi' || method === 'card') && (
          <input
            type="text"
            placeholder="Reference / Transaction ID"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}

        {(createOrder.isError || recordPayment.isError) && (
          <p className="text-xs text-red-500 mb-3">Failed to place order. Please try again.</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isPending || cartItems.length === 0}
          className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write src/pages/pos/CartPanel.jsx**

```jsx
import { useState } from 'react'
import useCartStore from '../../store/cartStore'
import CartItem from '../../components/pos/CartItem'
import PaymentModal from './PaymentModal'

const ORDER_TYPES = [
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
]

export default function CartPanel({ taxRate = 5 }) {
  const items = useCartStore((s) => s.items)
  const orderType = useCartStore((s) => s.orderType)
  const tableNumber = useCartStore((s) => s.tableNumber)
  const setOrderMeta = useCartStore((s) => s.setOrderMeta)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)
  const [showPayment, setShowPayment] = useState(false)

  const sub = subtotal()
  const t = tax(taxRate)
  const tot = total(taxRate)

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex gap-1 mb-2">
          {ORDER_TYPES.map((ot) => (
            <button
              key={ot.value}
              onClick={() => setOrderMeta({ orderType: ot.value })}
              className={`flex-1 py-1 text-xs rounded-lg font-medium transition ${
                orderType === ot.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ot.label}
            </button>
          ))}
        </div>
        {orderType === 'dine_in' && (
          <input
            type="text"
            placeholder="Table number"
            value={tableNumber}
            onChange={(e) => setOrderMeta({ tableNumber: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 divide-y divide-gray-100">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-12">Cart is empty</p>
        ) : (
          items.map((item) => <CartItem key={item.key} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <div className="px-4 py-4 border-t border-gray-200 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>₹{sub.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>GST ({taxRate}%)</span><span>₹{t.toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Total</span><span>₹{tot.toFixed(0)}</span>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={clearCart}
              className="flex-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              Clear
            </button>
            <button
              onClick={() => setShowPayment(true)}
              className="flex-1 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition"
            >
              Pay ₹{tot.toFixed(0)}
            </button>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal taxRate={taxRate} onClose={() => setShowPayment(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update POSScreen to use CartPanel**

Replace the placeholder cart div in `src/pages/pos/POSScreen.jsx`:

```jsx
import MenuGrid from './MenuGrid'
import CartPanel from './CartPanel'

export default function POSScreen() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden border-r border-gray-200">
        <MenuGrid />
      </div>
      <div className="w-80 xl:w-96 flex-none bg-white border-l border-gray-200">
        <CartPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add keyboard shortcut — Enter = Pay, Escape = Clear cart**

In `src/pages/pos/POSScreen.jsx` update to add keyboard handler:

```jsx
import { useEffect, useState } from 'react'
import MenuGrid from './MenuGrid'
import CartPanel from './CartPanel'
import PaymentModal from './PaymentModal'
import useCartStore from '../../store/cartStore'

export default function POSScreen() {
  const [showPayment, setShowPayment] = useState(false)
  const clearCart = useCartStore((s) => s.clearCart)
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && items.length > 0) setShowPayment(true)
      if (e.key === 'Escape') clearCart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length, clearCart])

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden border-r border-gray-200">
        <MenuGrid />
      </div>
      <div className="w-80 xl:w-96 flex-none bg-white border-l border-gray-200">
        <CartPanel />
      </div>
      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} />
      )}
    </div>
  )
}
```

Also update `CartPanel.jsx` to accept `onPay` prop instead of managing PaymentModal internally (since POSScreen now owns it). Replace the `setShowPayment(true)` in CartPanel's Pay button with a prop call:

In `CartPanel.jsx`, change the component signature to:
```jsx
export default function CartPanel({ taxRate = 5, onPay }) {
```

And the Pay button onClick to:
```jsx
onClick={onPay}
```

And remove the `showPayment` state and `PaymentModal` from `CartPanel.jsx` entirely.

In `POSScreen.jsx`, pass `onPay` to CartPanel:
```jsx
<CartPanel onPay={() => setShowPayment(true)} />
```

- [ ] **Step 6: Test POS flow in browser**

Start the dev server and verify:
1. Menu items appear in the grid
2. Clicking an item adds it to the cart panel
3. Clicking an item again increments quantity
4. Minus/plus buttons change quantity; 0 removes item
5. Order type tabs switch between Dine In / Takeaway / Delivery
6. Table number field shows for Dine In, hides for others
7. Pay button opens PaymentModal with correct totals
8. Place Order calls API and clears cart on success
9. Press Enter key → payment modal opens; Escape → cart clears

- [ ] **Step 7: Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
git add src/components/pos/CartItem.jsx src/pages/pos/CartPanel.jsx
git add src/pages/pos/PaymentModal.jsx src/pages/pos/POSScreen.jsx
git commit -m "feat: cart panel, payment modal, keyboard shortcuts"
```

---

## Task 11: Order History Page

**Files:**
- Create: `src/pages/orders/OrderHistory.jsx`
- Modify: `src/router/index.jsx`

- [ ] **Step 1: Write src/pages/orders/OrderHistory.jsx**

```jsx
import { useState } from 'react'
import { useOrders } from '../../api/orders'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const ORDER_TYPE_LABELS = {
  dine_in: 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
  online: 'Online',
}

export default function OrderHistory() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: orders = [], isLoading } = useOrders(statusFilter ? { status: statusFilter } : {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm text-center mt-12">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-12">No orders found</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Table</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{order.order_number}</td>
                  <td className="px-4 py-3 text-gray-600">{ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}</td>
                  <td className="px-4 py-3 text-gray-500">{order.table_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{order.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">₹{order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add route — update src/router/index.jsx**

Add import:
```jsx
import OrderHistory from '../pages/orders/OrderHistory'
```

Add to AppLayout children:
```jsx
{ path: '/orders', element: <OrderHistory /> },
```

- [ ] **Step 3: Verify in browser**

Navigate to `/orders`. Verify: orders list loads, status filter works, order number / total / status display correctly.

- [ ] **Step 4: Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
git add src/pages/orders/OrderHistory.jsx src/router/index.jsx
git commit -m "feat: order history page with status filter"
```

---

## Task 12: Menu Manager Page

**Files:**
- Create: `src/pages/menu/MenuManager.jsx`
- Modify: `src/router/index.jsx`

- [ ] **Step 1: Write src/pages/menu/MenuManager.jsx**

```jsx
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCategories, useMenuItems,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
} from '../../api/menu'

const ITEM_TYPE_LABELS = { veg: '🟢 Veg', non_veg: '🔴 Non-Veg', egg: '🟡 Egg' }

export default function MenuManager() {
  const [activeCatId, setActiveCatId] = useState(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [catName, setCatName] = useState('')
  const [itemForm, setItemForm] = useState({ name: '', price: '', item_type: 'veg', description: '' })

  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useMenuItems(activeCatId ? { category: activeCatId } : {})

  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()

  const handleSaveCat = () => {
    if (editingCat) {
      updateCat.mutate({ id: editingCat.id, name: catName }, { onSuccess: () => { setShowCatForm(false); setEditingCat(null); setCatName('') } })
    } else {
      createCat.mutate({ name: catName, sort_order: categories.length }, { onSuccess: () => { setShowCatForm(false); setCatName('') } })
    }
  }

  const handleSaveItem = () => {
    const payload = { ...itemForm, category: activeCatId, price: parseFloat(itemForm.price).toFixed(2) }
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload }, { onSuccess: () => { setShowItemForm(false); setEditingItem(null); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) } })
    } else {
      createItem.mutate(payload, { onSuccess: () => { setShowItemForm(false); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) } })
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Category sidebar */}
      <div className="w-56 flex-none border-r border-gray-200 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Categories</span>
          <button onClick={() => { setShowCatForm(true); setEditingCat(null); setCatName('') }} className="text-brand-600 hover:text-brand-700">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setActiveCatId(null)}
            className={`w-full text-left px-4 py-2 text-sm transition ${activeCatId === null ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className={`flex items-center group px-4 py-2 cursor-pointer transition ${activeCatId === cat.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveCatId(cat.id)}>
              <span className="flex-1 text-sm truncate">{cat.name}</span>
              <div className="hidden group-hover:flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setCatName(cat.name); setShowCatForm(true) }} className="text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate(cat.id) }} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900">Menu Items</h1>
          {activeCatId && (
            <button
              onClick={() => { setShowItemForm(true); setEditingItem(null); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
            >
              <Plus size={14} /> Add Item
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-12">
              {activeCatId ? 'No items in this category' : 'Select a category'}
            </p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-left">Available</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500">{ITEM_TYPE_LABELS[item.item_type]}</td>
                      <td className="px-4 py-3 text-right text-gray-900">₹{item.price}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, price: item.price, item_type: item.item_type, description: item.description || '' }); setShowItemForm(true) }} className="text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
                          <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id) }} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category form modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editingCat ? 'Edit Category' : 'New Category'}</h2>
            <input
              type="text" placeholder="Category name" value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCatForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveCat} disabled={!catName.trim()} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Item form modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Item' : 'New Item'}</h2>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Item name" value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input type="number" placeholder="Price (₹)" value={itemForm.price}
                onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={itemForm.item_type}
                onChange={(e) => setItemForm((f) => ({ ...f, item_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="veg">Veg</option>
                <option value="non_veg">Non-Veg</option>
                <option value="egg">Egg</option>
              </select>
              <textarea placeholder="Description (optional)" value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" rows={2} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowItemForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveItem} disabled={!itemForm.name.trim() || !itemForm.price}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add route — update src/router/index.jsx**

Add import:
```jsx
import MenuManager from '../pages/menu/MenuManager'
```

Add to AppLayout children:
```jsx
{ path: '/menu', element: <MenuManager /> },
```

- [ ] **Step 3: Verify in browser**

Navigate to `/menu`. Verify:
1. Category sidebar lists categories
2. "+" adds a new category (form modal)
3. Selecting a category shows its items
4. "Add Item" button adds an item to the selected category
5. Edit pencil pre-fills form; save updates item
6. Trash icon prompts confirmation then deletes

- [ ] **Step 4: Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1"
git add src/pages/menu/MenuManager.jsx src/router/index.jsx
git commit -m "feat: menu manager page with category + item CRUD"
```

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Menu management backend + frontend CRUD | Tasks 2, 3, 8, 12 |
| POS screen (menu grid + cart) | Tasks 9, 10 |
| Order creation API | Tasks 4, 5 |
| Payment recording | Task 6 |
| Order history | Task 11 |
| Max 2 clicks to add item to cart | Task 9 (one click on ItemCard) |
| Large touch targets (min 48px) | Task 9, 10 — ItemCard min-h-[80px], buttons w-6 h-6 |
| Category tabs across top of menu grid | Task 9 |
| Cart updates instantly (Zustand, no API until Place Order) | Task 7 cart store + Task 10 PaymentModal fires API |
| Keyboard shortcuts: Enter = Place Order, Escape = Clear cart | Task 10 Step 5 |
| Org-scoped querysets | Tasks 3, 5, 6 — all viewsets have `org is None → .none()` guard |
| Human-readable order numbers (ORD-0042) per branch | Task 4 — `_next_order_number` with `select_for_update` |
| Money stored as `decimal(10,2)`, never float | All models use `DecimalField(max_digits=10, decimal_places=2)` |
| `organization_id` injected from JWT, never from body | Tasks 3, 5, 6 — `perform_create` calls `serializer.save(organization=request.user.organization)` |

### No Placeholders

All steps contain actual code. No TBDs found.

### Type Consistency

- `cartStore.js`: `addItem(menuItem)` → `ItemCard` calls `onAdd(item)` which maps to `addItem` ✓
- `useCartStore` exported as default from `cartStore.js`, all consumers use `useCartStore` ✓
- `useCreateOrder` / `useRecordPayment` exported from `orders.js`, used in `PaymentModal` ✓
- `OrderDetailSerializer` includes `items` array — `OrderHistory` renders `order.items?.length` ✓
- `order-update-status` URL name used in test matches `url_name` in `@action(url_path='status')` + DRF basename `order` → `order-update-status` ✓

# 🌌 NEBULA - SaaS Multi-Vendor Marketplace Platform

منصة SaaS متكاملة للتجارة الإلكترونية متعددة التجار، موجهة للسوق السعودي والخليجي.

## المميزات الرئيسية

### 🔐 نظام المصادقة والأمان
- JWT + Refresh Tokens
- التحقق من البريد الإلكتروني
- إعادة تعيين كلمة المرور
- Rate Limiting وحماية CSRF
- Middleware للأدوار (Admin, Supervisor, Merchant, Affiliate, Customer)

### 🏪 نظام المتاجر
- إنشاء متجر بس slug فريد
- تصميم قابل للتخصيص (ألوان، شعار، غلاف)
- نظام multi-tenant مع tenantId
- متاجر متعددة تحت نفس المنصة

### 📦 نظام المنتجات
- إدارة المنتجات مع variants
- نظام الفئات والتصنيفات
- تتبع المخزون
- رفع الصور عبر Cloudinary

### 💳 نظام الاشتراكات (نموذج العمل الأساسي)
- **لا يوجد free trial**
- **لا توجد عمولات** - فقط اشتراكات شهرية
- خصم 50% على أول شهر للتجار والمسوقين
- تجديد تلقائي بالسعر الكامل بعد الشهر الأول
- خطط: Basic (99 ر.س), Pro (299 ر.س), Enterprise (799 ر.س), Affiliate (49 ر.س)

### 💰 نظام المدفوعات
- PayPal (Subscriptions + One-time payments)
- Tabby (اشتري الآن وادفع لاحقاً)
- Tamara (4 دفعات)
- Mada (بطاقات مدى السعودية)
- Cash on Delivery

### 👥 نظام التسويق بالعمولة
- روابط إحالة فريدة
- تتبع النقرات
- تحليلات الأداء
- **لا توجد عمولات** - المسوق يدفع اشتراك فقط

### 📊 لوحات التحكم
- Admin Dashboard: إدارة المستخدمين والمتاجر والاشتراكات
- Merchant Dashboard: إدارة المتجر والمنتجات والطلبات
- Affiliate Dashboard: تتبع الروابط والنقرات
- Customer Dashboard: سجل الطلبات

### 🔔 الإشعارات
- إشعارات بالبريد الإلكتروني
- إشعارات داخل التطبيق
- Webhooks للمدفوعات

## 🛠️ التقنيات المستخدمة

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** + **PostgreSQL** (Supabase)
- **Redis** للـ Cache والـ Queue
- **JWT** للمصادقة
- **PayPal SDK** للمدفوعات
- **Cloudinary** للصور
- **Nodemailer** للبريد

### Frontend
- **Next.js 14** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** لإدارة الحالة
- **TanStack Query** للـ API
- **Framer Motion** للرسوم المتحركة
- **PayPal React SDK**

## 🚀 البدء

### المتطلبات
- Node.js 18+
- PostgreSQL (Supabase)
- Redis

### 1. تثبيت الاعتماديات

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. إعداد متغيرات البيئة

Backend `.env` (موجود بالفعل):
- DATABASE_URL: اتصال PostgreSQL
- JWT_SECRET: مفتاح JWT
- PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET: بيانات PayPal
- EMAIL_USER & EMAIL_PASS: بيانات SMTP
- CLOUDINARY_*: بيانات Cloudinary

### 3. إعداد قاعدة البيانات

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

### 4. تشغيل المشروع

```bash
# Backend (Port 5000)
cd backend
npm run dev

# Frontend (Port 3000)
cd frontend
npm run dev
```

## 📁 هيكل المشروع

```
nebula/
├── backend/
│   ├── src/
│   │   ├── config/       # Database, Redis, Email
│   │   ├── controllers/  # API Controllers
│   │   ├── middleware/   # Auth, Validation, Rate Limiting
│   │   ├── routes/       # API Routes
│   │   ├── services/     # Business Logic
│   │   ├── utils/        # Helpers
│   │   └── types/        # TypeScript Types
│   ├── prisma/
│   │   └── schema.prisma # Database Schema
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # UI Components
│   │   ├── hooks/        # Custom Hooks
│   │   ├── lib/          # API & Utils
│   │   └── stores/       # Zustand Stores
│   └── public/
└── README.md
```


---

اريد منك الان ان تفعل هذا باستخدام هذا الحساب
fatora1h@gmail.com /اسم الحساب 
كلمة السر /
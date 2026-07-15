import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      full_name TEXT,
      phone TEXT,
      address TEXT,
      state TEXT,
      pincode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      main_image TEXT,
      additional_images TEXT, -- JSON string
      original_price REAL,
      discount_price REAL,
      stock_quantity INTEGER DEFAULT 0,
      description TEXT,
      tag TEXT,
      is_cod_available BOOLEAN DEFAULT 1,
      sizes TEXT, -- JSON string
      colors TEXT, -- JSON string
      new_arrival_days INTEGER DEFAULT 7,
      variant_stock TEXT, -- JSON string mapping size-color to stock quantity
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS sliders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      desktop_banner TEXT,
      mobile_banner TEXT,
      category_id INTEGER,
      description TEXT,
      show_description INTEGER DEFAULT 0,
      button_text TEXT,
      show_button INTEGER DEFAULT 0,
      desc_color TEXT DEFAULT '#ffffff',
      desc_position TEXT DEFAULT 'middle-center',
      button_position TEXT DEFAULT 'middle-center',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_amount REAL,
      status TEXT DEFAULT 'PENDING_PAYMENT',
      shipping_address TEXT,
      phone TEXT,
      payment_method TEXT,
      transaction_id TEXT,
      payment_status TEXT DEFAULT 'PENDING',
      payment_id TEXT,
      razorpay_order_id TEXT,
      payment_verified_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      size TEXT,
      color TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_payments (
      razorpay_order_id TEXT PRIMARY KEY,
      user_id INTEGER,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 1, -- 1 = active, 0 = inactive
      discount_type TEXT NOT NULL, -- 'flat', 'percentage', 'free_delivery'
      discount_value REAL DEFAULT 0,
      max_discount REAL, -- only for percentage
      min_order_amount REAL DEFAULT 0,
      eligibility TEXT, -- JSON string
      user_usage_limit INTEGER DEFAULT 1,
      total_usage_limit INTEGER,
      one_coupon_per_order INTEGER DEFAULT 1, -- 1 = yes, 0 = no
      start_date DATETIME,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      discount_applied REAL DEFAULT 0,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_user ON coupon_usage(coupon_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
  `);

  // Migration: Add new_arrival_days to products if it doesn't exist
  try {
    db.prepare("ALTER TABLE products ADD COLUMN new_arrival_days INTEGER DEFAULT 7").run();
  } catch (e) {
    // Column already exists or other error
  }

  // Migration: Add variant_stock to products if it doesn't exist
  try {
    db.prepare("ALTER TABLE products ADD COLUMN variant_stock TEXT").run();
  } catch (e) {
    // Column already exists or other error
  }

  // Migration: Add new payment columns to orders if they don't exist
  try {
    db.prepare("ALTER TABLE orders ADD COLUMN payment_id TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE orders ADD COLUMN payment_verified_at TEXT").run();
  } catch (e) {}

  // Migration: Add new columns to sliders if they don't exist
  try { db.prepare("ALTER TABLE sliders ADD COLUMN description TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE sliders ADD COLUMN show_description INTEGER DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE sliders ADD COLUMN button_text TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE sliders ADD COLUMN show_button INTEGER DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE sliders ADD COLUMN desc_color TEXT DEFAULT '#ffffff'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE sliders ADD COLUMN desc_position TEXT DEFAULT 'middle-center'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE sliders ADD COLUMN button_position TEXT DEFAULT 'middle-center'").run(); } catch (e) {}

  // Create admin users if not exists
  const admins = [
    { email: 'aquibbhombal708@gmail.com', password: '@Aquib57', role: 'superadmin' },
    { email: 'moinneelam143@gmail.com', password: 'Admin@Password123', role: 'superadmin' }
  ];
  
  for (const admin of admins) {
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(admin.email);
    if (!user) {
      const hashedPassword = bcrypt.hashSync(admin.password, 10);
      db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(admin.email, hashedPassword, admin.role);
      console.log(`Admin user created: ${admin.email} with role ${admin.role}`);
    } else if (user.role !== admin.role) {
      // Only update role if it's different, don't reset password
      db.prepare('UPDATE users SET role = ? WHERE email = ?').run(admin.role, admin.email);
      console.log(`Admin user role updated: ${admin.email} to role ${admin.role}`);
    }
  }
}

export default db;

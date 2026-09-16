require("dotenv").config();

const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const vendorUsers = [
  {
    name: "Main Vendor",
    email: "vendor@marketplace.com",
    password: "Vendor@123"
  },
  {
    name: "Fashion Vendor",
    email: "vendor2@marketplace.com",
    password: "Vendor@123"
  },
  {
    name: "Home Vendor",
    email: "vendor3@marketplace.com",
    password: "Vendor@123"
  },
  {
    name: "Book Vendor",
    email: "vendor4@marketplace.com",
    password: "Vendor@123"
  },
  {
    name: "Sports Vendor",
    email: "vendor5@marketplace.com",
    password: "Vendor@123"
  }
];

const vendors = [
  {
    email: "vendor@marketplace.com",
    storeName: "TechWorld",
    description: "Electronics and gadgets store"
  },
  {
    email: "vendor2@marketplace.com",
    storeName: "FashionHub",
    description: "Fashion and clothing store"
  },
  {
    email: "vendor3@marketplace.com",
    storeName: "HomeNeeds",
    description: "Home and kitchen products"
  },
  {
    email: "vendor4@marketplace.com",
    storeName: "BookCorner",
    description: "Books and educational products"
  },
  {
    email: "vendor5@marketplace.com",
    storeName: "SportsZone",
    description: "Sports and fitness products"
  }
];

const categories = [
  ["Electronics", "Electronic devices and accessories"],
  ["Fashion", "Clothing, footwear and fashion accessories"],
  ["Home & Kitchen", "Products for home and kitchen"],
  ["Books", "Books and educational materials"],
  ["Sports", "Sports and fitness products"]
];

const products = [
  // Electronics
  ["TechWorld", "Electronics", "Wireless Headphones", "Bluetooth wireless headphones", 2499, 20],
  ["TechWorld", "Electronics", "Smart Watch", "Fitness smart watch", 3999, 15],
  ["TechWorld", "Electronics", "Bluetooth Speaker", "Portable Bluetooth speaker", 1999, 25],
  ["TechWorld", "Electronics", "Wireless Mouse", "Ergonomic wireless mouse", 799, 30],
  ["TechWorld", "Electronics", "Mechanical Keyboard", "RGB mechanical keyboard", 2999, 12],
  ["TechWorld", "Electronics", "USB-C Charger", "Fast charging USB-C adapter", 1299, 25],

  // Fashion
  ["FashionHub", "Fashion", "Men's T-Shirt", "Cotton casual t-shirt", 699, 40],
  ["FashionHub", "Fashion", "Women's Kurti", "Printed cotton kurti", 999, 25],
  ["FashionHub", "Fashion", "Denim Jeans", "Regular fit denim jeans", 1499, 20],
  ["FashionHub", "Fashion", "Running Shoes", "Comfortable running shoes", 2199, 18],
  ["FashionHub", "Fashion", "Leather Wallet", "Classic men's wallet", 599, 30],
  ["FashionHub", "Fashion", "Handbag", "Stylish women's handbag", 1299, 15],

  // Home & Kitchen
  ["HomeNeeds", "Home & Kitchen", "Non-Stick Pan", "Non-stick cooking pan", 899, 20],
  ["HomeNeeds", "Home & Kitchen", "Dinner Set", "12-piece ceramic dinner set", 1799, 10],
  ["HomeNeeds", "Home & Kitchen", "Water Bottle", "Stainless steel water bottle", 499, 35],
  ["HomeNeeds", "Home & Kitchen", "Table Lamp", "Modern LED table lamp", 799, 20],
  ["HomeNeeds", "Home & Kitchen", "Storage Box", "Multipurpose storage box", 399, 30],
  ["HomeNeeds", "Home & Kitchen", "Kitchen Knife Set", "Stainless steel knife set", 1199, 15],

  // Books
  ["BookCorner", "Books", "Java Programming", "Complete Java programming guide", 599, 20],
  ["BookCorner", "Books", "Clean Code", "Software development best practices", 799, 15],
  ["BookCorner", "Books", "Database Systems", "Introduction to database systems", 699, 12],
  ["BookCorner", "Books", "Web Development", "Modern web development guide", 649, 18],
  ["BookCorner", "Books", "Python Basics", "Beginner Python programming book", 499, 25],
  ["BookCorner", "Books", "Data Structures", "Data structures and algorithms", 749, 20],

  // Sports
  ["SportsZone", "Sports", "Yoga Mat", "Non-slip exercise yoga mat", 599, 30],
  ["SportsZone", "Sports", "Cricket Bat", "Professional cricket bat", 2499, 10],
  ["SportsZone", "Sports", "Football", "Training football", 899, 20],
  ["SportsZone", "Sports", "Dumbbells", "Pair of 5kg dumbbells", 1499, 15],
  ["SportsZone", "Sports", "Skipping Rope", "Adjustable skipping rope", 299, 40],
  ["SportsZone", "Sports", "Gym Gloves", "Workout and gym gloves", 499, 25]
];

db.connect(async (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }

  console.log("Connected to marketplace_db");

  try {
  
    // 1. CREATE VENDOR USERS
    

    for (const user of vendorUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await query(
        `INSERT INTO users (name, email, password, role)
         VALUES (?, ?, ?, 'vendor')
         ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         role = 'vendor'`,
        [user.name, user.email, hashedPassword]
      );

      console.log(`Vendor user ready: ${user.email}`);
    }

    
    // 2. CREATE VENDORS / STORES
    

    for (const vendor of vendors) {
      const userResult = await query(
        `SELECT id FROM users WHERE email = ?`,
        [vendor.email]
      );

      const userId = userResult[0].id;

      await query(
        `INSERT INTO vendors
         (user_id, store_name, description, status)
         VALUES (?, ?, ?, 'approved')
         ON DUPLICATE KEY UPDATE
         store_name = VALUES(store_name),
         description = VALUES(description),
         status = 'approved'`,
        [
          userId,
          vendor.storeName,
          vendor.description
        ]
      );

      console.log(`Vendor store ready: ${vendor.storeName}`);
    }

    
    // 3. CREATE CATEGORIES
    

    for (const category of categories) {
      await query(
        `INSERT INTO categories (name, description)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
         description = VALUES(description)`,
        category
      );

      console.log(`Category ready: ${category[0]}`);
    }

    
    // 4. CREATE PRODUCTS + INVENTORY
    

    for (const product of products) {
      const [
        storeName,
        categoryName,
        title,
        description,
        price,
        stock
      ] = product;

      const vendorResult = await query(
        `SELECT id
         FROM vendors
         WHERE store_name = ?`,
        [storeName]
      );

      const categoryResult = await query(
        `SELECT id
         FROM categories
         WHERE name = ?`,
        [categoryName]
      );

      if (vendorResult.length === 0) {
        console.log(`Vendor not found: ${storeName}`);
        continue;
      }

      if (categoryResult.length === 0) {
        console.log(`Category not found: ${categoryName}`);
        continue;
      }

      const vendorId = vendorResult[0].id;
      const categoryId = categoryResult[0].id;

      // Check whether product already exists
      const existingProduct = await query(
        `SELECT id
         FROM products
         WHERE vendor_id = ?
         AND title = ?`,
        [vendorId, title]
      );

      let productId;

      if (existingProduct.length > 0) {
        productId = existingProduct[0].id;

        await query(
          `UPDATE products
           SET category_id = ?,
               description = ?,
               price = ?,
               status = 'active'
           WHERE id = ?`,
          [
            categoryId,
            description,
            price,
            productId
          ]
        );

        console.log(`Product already exists: ${title}`);
      } else {
        const productResult = await query(
          `INSERT INTO products
           (vendor_id, category_id, title, description, price, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          [
            vendorId,
            categoryId,
            title,
            description,
            price
          ]
        );

        productId = productResult.insertId;

        console.log(`Product created: ${title}`);
      }

      // Create or update inventory
      await query(
        `INSERT INTO inventory
         (product_id, stock_quantity, low_stock_threshold)
         VALUES (?, ?, 5)
         ON DUPLICATE KEY UPDATE
         stock_quantity = VALUES(stock_quantity),
         low_stock_threshold = VALUES(low_stock_threshold)`,
        [productId, stock]
      );
    }

    console.log("");
    console.log("====================================");
    console.log("SAMPLE DATA SEEDING COMPLETED!");
    console.log("====================================");
    console.log("5 vendor users");
    console.log("5 vendor stores");
    console.log("5 categories");
    console.log("30 products");
    console.log("30 inventory records");
    console.log("====================================");

  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    db.end();
  }
});

function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory orders database
  interface ServerOrder {
    id: string;
    orderNumber?: string;
    name: string;
    phone: string;
    city?: string;
    fromLocation: string;
    toLocation: string;
    vehicleType: string;
    hasLockedWheels: boolean;
    hasSteeringIssue: boolean;
    needsDitchPull: boolean;
    distance: number;
    estimatedPrice: number;
    status: 'pending' | 'searching' | 'dispatched' | 'completed';
    createdAt: string;
    etaMinutes: number;
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    driverPlate?: string;
  }

  interface ServerDriver {
    id: string;
    name: string;
    phone: string;
    vehiclePlate: string;
    status: 'active' | 'busy' | 'offline';
    city?: string;
    password?: string;
    vehicleType?: string;
  }

  const DRIVERS_FILE = path.join(process.cwd(), "drivers.json");
  const ORDERS_FILE = path.join(process.cwd(), "orders.json");

  const DEFAULT_DRIVERS: ServerDriver[] = [
    { id: "drv-1", name: "Іван Ковальчук", phone: "+380671112233", vehiclePlate: "BC 1234 HP", status: "active", city: "Львів", password: "123", vehicleType: "Легковий евакуатор" },
    { id: "drv-2", name: "Олексій Шевченко", phone: "+380502223344", vehiclePlate: "AA 5678 KM", status: "active", city: "Київ", password: "123", vehicleType: "Евакуатор з маніпулятором" },
    { id: "drv-3", name: "Дмитро Кравченко", phone: "+380933334455", vehiclePlate: "AE 9012 BC", status: "busy", city: "Дніпро", password: "123", vehicleType: "Вантажний евакуатор" },
    { id: "drv-4", name: "Микола Кот", phone: "+380684445566", vehiclePlate: "BH 3456 OO", status: "active", city: "Одеса", password: "123", vehicleType: "Зі зсувною платформою" }
  ];

  function cleanPhone(phone: string): string {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 ? digits.slice(-9) : digits;
  }

  function loadDrivers(): ServerDriver[] {
    try {
      if (fs.existsSync(DRIVERS_FILE)) {
        return JSON.parse(fs.readFileSync(DRIVERS_FILE, "utf-8"));
      } else {
        fs.writeFileSync(DRIVERS_FILE, JSON.stringify(DEFAULT_DRIVERS, null, 2), "utf-8");
        return DEFAULT_DRIVERS;
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
    return DEFAULT_DRIVERS;
  }

  function saveDrivers(drivers: ServerDriver[]) {
    try {
      fs.writeFileSync(DRIVERS_FILE, JSON.stringify(drivers, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving drivers:", err);
    }
  }

  function loadOrders(): ServerOrder[] {
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    }
    return [];
  }

  function saveOrders(orders: ServerOrder[]) {
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving orders:", err);
    }
  }

  let ordersDb: ServerOrder[] = loadOrders();
  let driversDb: ServerDriver[] = loadDrivers();
  let lastOrderNumber = 1000;

  // API route for getting all orders
  app.get("/api/orders", (req, res) => {
    res.json(ordersDb);
  });

  // API route for canceling an order
  app.post("/api/cancel-order", (req, res) => {
    const { id } = req.body;
    if (id) {
      ordersDb = ordersDb.filter(o => o.id !== id);
      saveOrders(ordersDb);
    }
    res.json({ success: true, orders: ordersDb });
  });

  // Verify admin passcode
  app.post("/api/admin/verify", (req, res) => {
    const { password } = req.body;
    if (password === "3985") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Неправильний пароль" });
    }
  });

  // Admin update order
  app.post("/api/admin/update-order", async (req, res) => {
    const { id, status, etaMinutes } = req.body;
    const order = ordersDb.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Замовлення не знайдено" });
    }
    
    const previousStatus = order.status;

    if (status) {
      order.status = status;
      if (status === 'completed') {
        order.etaMinutes = 0;
        if (order.driverId) {
          const driver = driversDb.find(d => d.id === order.driverId);
          if (driver) {
            driver.status = 'active'; // Mark driver as active/free again
          }
        }
        // Auto-remove completed orders after 2 minutes
        setTimeout(() => {
          ordersDb = ordersDb.filter(o => o.id !== id);
          saveOrders(ordersDb);
        }, 120000);
      }
    }
    
    if (typeof etaMinutes === 'number') {
      order.etaMinutes = etaMinutes;
    }

    // Notify Telegram about status changes from Admin Panel
    if (status && status !== previousStatus) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (botToken && chatId) {
        try {
          let message = "";
          if (status === 'searching') {
            message = `
🟢 *ЗАЯВКУ ПРИЙНЯТО* 🟢

🎫 *Замовлення:* ${order.orderNumber || `#${order.id}`}
👤 *Клієнт:* ${order.name}
📞 *Телефон:* ${order.phone}
💰 *Вартість:* ${order.estimatedPrice} грн

⏳ *Диспетчер підтвердив заявку через панель керування. Зараз здійснюється підбір водія.*
            `.trim();
          } else if (status === 'dispatched') {
            message = `
🟢 *ЗАМОВЛЕННЯ ПІДТВЕРДЖЕНО (ВИЇЗД)* 🟢

🎫 *Замовлення:* ${order.orderNumber || `#${order.id}`}
👤 *Клієнт:* ${order.name}
📞 *Телефон:* ${order.phone}
💰 *Вартість:* ${order.estimatedPrice} грн

${order.driverName ? `🚚 *Призначений водій:* ${order.driverName}
📱 *Телефон водія:* ${order.driverPhone}
🔢 *Номер машини:* ${order.driverPlate}` : "⏳ *Водія буде призначено пізніше*"}

⏱ *Евакуатор виїхав на допомогу! Орієнтовний час прибуття: ${order.etaMinutes || 15} хв.*
            `.trim();
          } else if (status === 'completed') {
            message = `
🏁 *ЗАМОВЛЕННЯ ВИКОНАНО* 🏁

🎫 *Замовлення:* ${order.orderNumber || `#${order.id}`}
👤 *Клієнт:* ${order.name}
📞 *Телефон:* ${order.phone}
💰 *Вартість:* ${order.estimatedPrice} грн

🎉 *Евакуатор успішно прибув на місце події та розпочав допомогу клієнту!*
            `.trim();
          }

          if (message) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown"
              }),
            });
          }
        } catch (err) {
          console.error("Failed to send status update to Telegram:", err);
        }
      }
    }
    
    saveOrders(ordersDb);
    saveDrivers(driversDb);
    res.json({ success: true, order, orders: ordersDb });
  });

  // Admin delete order
  app.post("/api/admin/delete-order", (req, res) => {
    const { id } = req.body;
    ordersDb = ordersDb.filter(o => o.id !== id);
    saveOrders(ordersDb);
    res.json({ success: true, orders: ordersDb });
  });

  // GET all drivers
  app.get("/api/admin/drivers", (req, res) => {
    res.json(driversDb);
  });

  // Save (Create/Update) driver
  app.post("/api/admin/drivers/save", (req, res) => {
    const driver = req.body as ServerDriver;
    if (!driver.name || !driver.phone || !driver.vehiclePlate) {
      return res.status(400).json({ success: false, error: "Будь ласка, заповніть всі обов'язкові поля" });
    }

    if (driver.id) {
      // Edit
      const index = driversDb.findIndex(d => d.id === driver.id);
      if (index !== -1) {
        driversDb[index] = {
          ...driversDb[index],
          ...driver
        };
      } else {
        return res.status(404).json({ success: false, error: "Водія не знайдено" });
      }
    } else {
      // Create
      const newDriver: ServerDriver = {
        ...driver,
        id: `drv-${Math.random().toString(36).substring(2, 9)}`,
        status: driver.status || 'active'
      };
      driversDb.push(newDriver);
    }

    saveDrivers(driversDb);
    res.json({ success: true, drivers: driversDb });
  });

  // Delete driver
  app.post("/api/admin/drivers/delete", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "Не вказано ID водія" });
    }
    driversDb = driversDb.filter(d => d.id !== id);
    saveDrivers(driversDb);
    res.json({ success: true, drivers: driversDb });
  });

  // DRIVER AUTH & PORTAL APIS
  
  // Driver Registration
  app.post("/api/driver/register", (req, res) => {
    const { name, phone, password, city, vehiclePlate, vehicleType } = req.body;
    
    if (!name || !phone || !password || !vehiclePlate) {
      return res.status(400).json({ success: false, error: "Будь ласка, заповніть обов'язкові поля: ім'я, телефон, пароль та номер авто" });
    }

    const cleanRegPhone = cleanPhone(phone);
    const existingDriver = driversDb.find(d => cleanPhone(d.phone) === cleanRegPhone);
    if (existingDriver) {
      return res.status(400).json({ success: false, error: "Водій з таким номером телефону вже зареєстрований" });
    }

    const newDriver: ServerDriver = {
      id: `drv-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      phone: phone.trim(),
      password: password,
      city: city ? city.trim() : "",
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      vehicleType: vehicleType ? vehicleType.trim() : "Евакуатор",
      status: 'active'
    };

    driversDb.push(newDriver);
    saveDrivers(driversDb);
    console.log(`Registered new driver: ${newDriver.name} (${newDriver.id})`);
    
    // Return driver without password for security
    const { password: _, ...driverResponse } = newDriver;
    res.json({ success: true, driver: driverResponse });
  });

  // Driver Login
  app.post("/api/driver/login", (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: "Введіть номер телефону та пароль" });
    }

    const cleanLoginPhone = cleanPhone(phone);
    const driver = driversDb.find(d => cleanPhone(d.phone) === cleanLoginPhone);
    
    if (!driver || driver.password !== password) {
      return res.status(401).json({ success: false, error: "Неправильний номер телефону або пароль" });
    }

    const { password: _, ...driverResponse } = driver;
    res.json({ success: true, driver: driverResponse });
  });

  // Driver Update Profile & Status
  app.post("/api/driver/update-profile", (req, res) => {
    const { id, name, phone, city, vehiclePlate, vehicleType, status, password } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "Не вказано ID водія" });
    }

    const index = driversDb.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Водія не знайдено" });
    }

    const currentDriver = driversDb[index];

    // Optional phone duplication check
    if (phone && cleanPhone(phone) !== cleanPhone(currentDriver.phone)) {
      const cleanUpdatePhone = cleanPhone(phone);
      const existing = driversDb.find(d => cleanPhone(d.phone) === cleanUpdatePhone && d.id !== id);
      if (existing) {
        return res.status(400).json({ success: false, error: "Цей номер телефону вже використовується іншим водієм" });
      }
    }

    // Update fields
    if (name) currentDriver.name = name.trim();
    if (phone) currentDriver.phone = phone.trim();
    if (city !== undefined) currentDriver.city = city.trim();
    if (vehiclePlate) currentDriver.vehiclePlate = vehiclePlate.toUpperCase().trim();
    if (vehicleType !== undefined) currentDriver.vehicleType = vehicleType.trim();
    if (status) currentDriver.status = status;
    if (password) currentDriver.password = password;

    saveDrivers(driversDb);

    const { password: _, ...driverResponse } = currentDriver;
    res.json({ success: true, driver: driverResponse });
  });

  // Get active/assigned orders for a specific driver
  app.get("/api/driver/orders", (req, res) => {
    const { driverId } = req.query;
    if (!driverId) {
      return res.status(400).json({ success: false, error: "Не вказано ID водія" });
    }

    // Filter orders assigned to this driver and not auto-removed yet
    const driverOrders = ordersDb.filter(o => o.driverId === driverId);
    res.json({ success: true, orders: driverOrders });
  });

  // Assign driver to order
  app.post("/api/admin/assign-driver", async (req, res) => {
    const { orderId, driverId } = req.body;
    const order = ordersDb.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Замовлення не знайдено" });
    }

    if (!driverId) {
      // Unassign
      order.driverId = undefined;
      order.driverName = undefined;
      order.driverPhone = undefined;
      order.driverPlate = undefined;
      if (order.status === 'dispatched') {
        order.status = 'searching';
        order.etaMinutes = undefined;
      }
      return res.json({ success: true, order, orders: ordersDb });
    }

    const driver = driversDb.find(d => d.id === driverId);
    if (!driver) {
      return res.status(404).json({ success: false, error: "Водія не знайдено в базі даних" });
    }

    order.driverId = driver.id;
    order.driverName = driver.name;
    order.driverPhone = driver.phone;
    order.driverPlate = driver.vehiclePlate;

    // Automatically transition to dispatched if it was pending or searching
    if (order.status === 'pending' || order.status === 'searching') {
      order.status = 'dispatched';
      order.etaMinutes = 15;
    }

    // Attempt to notify Telegram about driver assignment
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      try {
        const message = `
👨‍✈️ *ПРИЗНАЧЕНО ВОДІЯ НА ВИКЛИК* 👨‍✈️

🎫 *Замовлення:* ${order.orderNumber || `#${order.id}`}
👤 *Клієнт:* ${order.name}
📞 *Телефон:* ${order.phone}

🚚 *Евакуаторник:* ${driver.name}
📱 *Телефон водія:* ${driver.phone}
🔢 *Номер машини:* ${driver.vehiclePlate}
🏙️ *Місто роботи:* ${driver.city || "Не вказано"}

⏱️ *Орієнтовний час прибуття:* 15 хв.
        `.trim();

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            link_preview_options: {
              is_disabled: true
            }
          }),
        });
      } catch (err) {
        console.error("Failed to send driver assignment message to Telegram:", err);
      }
    }

    res.json({ success: true, order, orders: ordersDb });
  });

  // API route for accepting/confirming an order request from Telegram link
  app.get("/api/accept-order", (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.status(400).send("Не вказано ID замовлення");
    }

    const order = ordersDb.find(o => o.id === id);
    if (!order) {
      return res.status(404).send(`Замовлення з ID ${id} не знайдено у списку активних`);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Прийняти заявку</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div class="text-center mb-6">
            <span class="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-500/20 mb-2">
              Підтвердження заявки
            </span>
            <h1 class="text-xl font-black uppercase tracking-wider text-white">Замовлення ${order.orderNumber || `#${order.id.toString().toUpperCase()}`}</h1>
            <p class="text-xs text-slate-400 mt-1">Підтвердіть прийом заявки та переведення у статус пошуку водія</p>
          </div>

          <!-- Details card -->
          <div class="bg-slate-950/60 rounded-2xl p-4.5 mb-6 border border-slate-800/80 text-left space-y-3 text-xs text-slate-300">
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Клієнт:</span>
              <span class="font-bold text-white">${order.name}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Телефон:</span>
              <a href="tel:${order.phone}" class="font-bold text-amber-400 hover:underline">${order.phone}</a>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Місто:</span>
              <span class="font-bold text-white">${order.city || "Не вказано"}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Автомобіль:</span>
              <span class="font-bold text-white">${order.vehicleType}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Звідки:</span>
              <span class="font-bold text-white text-right max-w-[200px] truncate" title="${order.fromLocation}">
                ${order.fromLocation}
              </span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Куди:</span>
              <span class="font-bold text-white text-right max-w-[200px] truncate" title="${order.toLocation}">
                ${order.toLocation}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-semibold">Ціна:</span>
              <span class="font-bold text-emerald-400 text-sm">${order.estimatedPrice} грн</span>
            </div>
          </div>

          <!-- Confirm Form -->
          <form method="POST" action="/api/accept-order?id=${order.id}">
            <button
              type="submit"
              class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              🟢 ПРИЙНЯТИ ЗАЯВКУ
            </button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  // Action POST route for accepting order request
  app.post("/api/accept-order", async (req, res) => {
    const { id } = req.query;
    const orderId = id as string;
    if (!orderId) {
      return res.status(400).send("Не вказано ID замовлення");
    }

    const order = ordersDb.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).send(`Замовлення з ID ${orderId} не знайдено у списку активних`);
    }

    order.status = 'searching';
    order.etaMinutes = undefined;

    saveOrders(ordersDb);

    // Try to notify Telegram about request acceptance
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      try {
        let host = (req.headers['x-forwarded-host'] as string) || req.get('host') || "localhost:3000";
        if (host.includes(',')) {
          host = host.split(',')[0].trim();
        }
        const protocol = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https' ? 'https' : 'http';
        const confirmUrl = `${protocol}://${host}/api/confirm-order?id=${orderId}`;
        const completeUrl = `${protocol}://${host}/api/complete-order?id=${orderId}`;

        const isInvalidTelegramUrl = 
          confirmUrl.includes('localhost') || 
          confirmUrl.includes('127.0.0.1') || 
          confirmUrl.includes('0.0.0.0') || 
          confirmUrl.includes('::1');

        const message = `
🟢 *ЗАЯВКУ ПРИЙНЯТО* 🟢

🎫 *Замовлення:* ${order.orderNumber || `#${order.id}`}
👤 *Клієнт:* ${order.name}
📞 *Телефон:* ${order.phone}
💰 *Вартість:* ${order.estimatedPrice} грн

⏳ *Диспетчер підтвердив заявку. Зараз здійснюється підбір водія та узгодження виїзду.*

${isInvalidTelegramUrl ? `🔗 *Підтвердити виїзд:* ${confirmUrl}\n🏁 *Водій прибув:* ${completeUrl}` : `🔗 [Підтвердити виїзд евакуатора](${confirmUrl})\n🏁 [Водій прибув на місце події](${completeUrl})`}
        `.trim();

        const payload: any = {
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          link_preview_options: {
            is_disabled: true
          }
        };

        if (!isInvalidTelegramUrl) {
          payload.reply_markup = {
            inline_keyboard: [
              [
                {
                  "text": "🚚 ПІДТВЕРДИТИ ВИЇЗД",
                  "url": confirmUrl
                }
              ],
              [
                {
                  "text": "🏁 ВОДІЙ ПРИБУВ НА МІСЦЕ",
                  "url": completeUrl
                }
              ]
            ]
          };
        }

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Failed to send accept message to Telegram:", err);
      }
    }

    let host = (req.headers['x-forwarded-host'] as string) || req.get('host') || "localhost:3000";
    if (host.includes(',')) {
      host = host.split(',')[0].trim();
    }
    const protocol = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https' ? 'https' : 'http';
    const nextStepUrl = `${protocol}://${host}/api/confirm-order?id=${orderId}`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Заявку прийнято</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div class="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6">
            <svg class="h-8 w-8 text-amber-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
          </div>

          <h1 class="text-2xl font-black mb-2">Заявку прийнято!</h1>
          <p class="text-slate-400 text-sm mb-6">
            Замовлення <span class="text-amber-500 font-mono font-bold">${order.orderNumber || `#${orderId.toUpperCase()}`}</span> переведено у статус пошуку вільного евакуатора.
          </p>

          <div class="bg-slate-950/60 rounded-2xl p-4 mb-6 border border-slate-800/50 text-left space-y-2 text-xs text-slate-300">
            <div>Клієнт: <span class="font-bold text-white">${order.name}</span></div>
            <div>Телефон: <span class="font-bold text-white">${order.phone}</span></div>
            <div>Авто: <span class="font-bold text-white">${order.vehicleType}</span></div>
          </div>

          <div class="space-y-3">
            <a 
              href="${nextStepUrl}"
              class="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-900/10"
            >
              🚚 ПІДТВЕРДИТИ ВИЇЗД ЕВАКУАТОРА
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // API route for confirming/dispatching an order from Telegram link
  app.get("/api/confirm-order", (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.status(400).send("Не вказано ID замовлення");
    }

    const order = ordersDb.find(o => o.id === id);
    if (!order) {
      return res.status(404).send(`Замовлення з ID ${id} не знайдено у списку активних`);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Підтвердження замовлення</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div class="text-center mb-6">
            <span class="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-500/20 mb-2">
              Підтвердження виклику
            </span>
            <h1 class="text-xl font-black uppercase tracking-wider text-white">Замовлення ${order.orderNumber || `#${order.id.toString().toUpperCase()}`}</h1>
            <p class="text-xs text-slate-400 mt-1">Перевірте деталі та підтвердіть відправку евакуатора</p>
          </div>

          <!-- Details card -->
          <div class="bg-slate-950/60 rounded-2xl p-4.5 mb-6 border border-slate-800/80 text-left space-y-3 text-xs text-slate-300">
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Клієнт:</span>
              <span class="font-bold text-white">${order.name}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Телефон:</span>
              <a href="tel:${order.phone}" class="font-bold text-amber-400 hover:underline">${order.phone}</a>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Місто:</span>
              <span class="font-bold text-white">${order.city || "Не вказано"}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Автомобіль:</span>
              <span class="font-bold text-white">${order.vehicleType}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Звідки:</span>
              <span class="font-bold text-white text-right max-w-[200px] truncate" title="${order.fromLocation}">
                ${order.fromLocation}
              </span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Куди:</span>
              <span class="font-bold text-white text-right max-w-[200px] truncate" title="${order.toLocation}">
                ${order.toLocation}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-semibold">Ціна:</span>
              <span class="font-bold text-emerald-400 text-sm">${order.estimatedPrice} грн</span>
            </div>
          </div>

          <!-- Confirm Form -->
          <form method="POST" action="/api/confirm-order?id=${order.id}" class="space-y-5">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Призначити водія (опціонально)</label>
              <select 
                name="driverId"
                class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-amber-500/60 appearance-none cursor-pointer"
              >
                <option value="">-- Без призначення (вибрати пізніше) --</option>
                ${driversDb.map(d => `
                  <option value="${d.id}" ${order.driverId === d.id ? 'selected' : ''}>
                    ${d.name} (${d.vehiclePlate}) — ${d.status === 'active' ? '🟢 Вільний' : d.status === 'busy' ? '🟡 На виклику' : '⚫ Офлайн'}
                  </option>
                `).join('')}
              </select>
            </div>

            <button
              type="submit"
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-900/10"
            >
              🟢 ПІДТВЕРДИТИ ВИЇЗД
            </button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  // Action POST route for confirming/dispatching an order from confirmation page
  app.post("/api/confirm-order", async (req, res) => {
    const { id } = req.query;
    const { driverId } = req.body;

    const orderId = id as string;
    if (!orderId) {
      return res.status(400).send("Не вказано ID замовлення");
    }

    const order = ordersDb.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).send(`Замовлення з ID ${orderId} не знайдено у списку активних`);
    }

    if (driverId) {
      const driver = driversDb.find(d => d.id === driverId);
      if (driver) {
        order.driverId = driver.id;
        order.driverName = driver.name;
        order.driverPhone = driver.phone;
        order.driverPlate = driver.vehiclePlate;
        driver.status = 'busy'; // Update driver status as busy
      }
    }
    order.status = 'dispatched';
    order.etaMinutes = 15;

    saveOrders(ordersDb);
    saveDrivers(driversDb);

    // Try to notify Telegram about dispatch & driver info
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      try {
        const message = `
🟢 *ЗАМОВЛЕННЯ ПІДТВЕРДЖЕНО* 🟢

🎫 *Замовлення:* ${order.orderNumber || `#${order.id}`}
👤 *Клієнт:* ${order.name}
📞 *Телефон:* ${order.phone}
💰 *Вартість:* ${order.estimatedPrice} грн

${order.driverName ? `🚚 *Призначений водій:* ${order.driverName}
📱 *Телефон водія:* ${order.driverPhone}
🔢 *Номер машини:* ${order.driverPlate}` : "⏳ *Водія буде призначено пізніше через адмін-панель*"}
        `.trim();

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown"
          }),
        });
      } catch (err) {
        console.error("Failed to send confirm dispatch message to Telegram:", err);
      }
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Замовлення підтверджено</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div class="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <svg class="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 class="text-2xl font-black mb-2">Успішно підтверджено!</h1>
          <p class="text-slate-400 text-sm mb-6">
            Замовлення <span class="text-amber-500 font-mono font-bold">${order.orderNumber || `#${orderId.toUpperCase()}`}</span> переведено в статус "Евакуатор виїхав на допомогу".
          </p>

          <div class="bg-slate-950/60 rounded-2xl p-4 mb-6 border border-slate-800/50 text-left space-y-2 text-xs text-slate-300">
            <div>Клієнт: <span class="font-bold text-white">${order.name}</span></div>
            <div>Телефон: <span class="font-bold text-white">${order.phone}</span></div>
            <div>Місто: <span class="font-bold text-white">${order.city || "Не вказано"}</span></div>
            <div>Авто: <span class="font-bold text-white">${order.vehicleType}</span></div>
            ${order.driverName ? `<div>Водій: <span class="font-bold text-amber-400">${order.driverName} (${order.driverPlate})</span></div>` : ""}
          </div>

          <p class="text-xs text-slate-500">
            Клієнт миттєво побачить оновлення на сайті в реальному часі. Дякуємо за роботу!
          </p>
        </div>
      </body>
      </html>
    `);
  });

  // API route for completing/arriving an order from Telegram link
  app.get("/api/complete-order", (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.status(400).send("Не вказано ID замовлення");
    }

    const order = ordersDb.find(o => o.id === id);
    if (!order) {
      return res.status(404).send(`Замовлення з ID ${id} не знайдено у списку активних`);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Завершення виклику</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div class="text-center mb-6">
            <span class="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-500/20 mb-2">
              Завершення виклику
            </span>
            <h1 class="text-xl font-black uppercase tracking-wider text-white">Замовлення ${order.orderNumber || `#${order.id.toString().toUpperCase()}`}</h1>
            <p class="text-xs text-slate-400 mt-1">Підтвердіть, що евакуатор прибув на місце події</p>
          </div>

          <!-- Details card -->
          <div class="bg-slate-950/60 rounded-2xl p-4.5 mb-6 border border-slate-800/80 text-left space-y-3 text-xs text-slate-300">
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Клієнт:</span>
              <span class="font-bold text-white">${order.name}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Телефон:</span>
              <span class="font-bold text-white">${order.phone}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Місто:</span>
              <span class="font-bold text-white">${order.city || "Не вказано"}</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/40 pb-2">
              <span class="text-slate-500 font-semibold">Звідки:</span>
              <span class="font-bold text-white truncate max-w-[200px]" title="${order.fromLocation}">${order.fromLocation}</span>
            </div>
            ${order.driverName ? `
            <div class="flex justify-between">
              <span class="text-slate-500 font-semibold">Водій:</span>
              <span class="font-bold text-amber-400">${order.driverName}</span>
            </div>
            ` : ""}
          </div>

          <!-- Complete Form -->
          <form method="POST" action="/api/complete-order?id=${order.id}">
            <button
              type="submit"
              class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              🏁 ВОДІЙ ПРИБУВ НА МІСЦЕ
            </button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  // Action POST route for completing order
  app.post("/api/complete-order", (req, res) => {
    const { id } = req.query;
    const orderId = id as string;
    if (!orderId) {
      return res.status(400).send("Не вказано ID замовлення");
    }

    const order = ordersDb.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).send(`Замовлення з ID ${orderId} не знайдено у списку активних`);
    }

    order.status = 'completed';
    order.etaMinutes = 0;

    if (order.driverId) {
      const driver = driversDb.find(d => d.id === order.driverId);
      if (driver) {
        driver.status = 'active'; // Mark driver as active/free again
      }
    }

    saveOrders(ordersDb);
    saveDrivers(driversDb);

    // Auto-remove completed orders after 2 minutes
    setTimeout(() => {
      ordersDb = ordersDb.filter(o => o.id !== orderId);
      saveOrders(ordersDb);
    }, 120000);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Евакуатор прибув на місце</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div class="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6">
            <svg class="h-8 w-8 text-amber-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>

          <h1 class="text-2xl font-black mb-2 text-amber-400">Водій прибув на місце!</h1>
          <p class="text-slate-400 text-sm mb-6">
            Замовлення <span class="text-white font-mono font-bold">${order.orderNumber || `#${orderId.toString().toUpperCase()}`}</span> успішно оновлено. Статус: "Евакуатор прибув на місце події".
          </p>

          <div class="bg-slate-950/60 rounded-2xl p-4 mb-6 border border-slate-800/50 text-left space-y-2 text-xs text-slate-300">
            <div>Клієнт: <span class="font-bold text-white">${order.name}</span></div>
            <div>Телефон: <span class="font-bold text-white">${order.phone}</span></div>
            <div>Місто: <span class="font-bold text-white">${order.city || "Не вказано"}</span></div>
            <div>Адреса події: <span class="font-bold text-white">${order.fromLocation}</span></div>
            ${order.driverName ? `<div>Водій: <span class="font-bold text-amber-400">${order.driverName}</span></div>` : ""}
          </div>

          <p class="text-xs text-slate-500">
            Клієнт бачить на сайті повідомлення про те, що евакуатор прибув на місце та починає завантаження.
          </p>
        </div>
      </body>
      </html>
    `);
  });

  // API route for Telegram notification
  app.post("/api/notify-telegram", async (req, res) => {
    const order = req.body as ServerOrder;
    const orderId = order.id || Math.random().toString(36).substring(2, 9);
    
    const existingOrder = ordersDb.find(o => o.id === orderId);
    let orderNumber = order.orderNumber || (existingOrder ? existingOrder.orderNumber : undefined);
    
    if (!orderNumber) {
      lastOrderNumber++;
      orderNumber = `#${lastOrderNumber}`;
    }
    
    // Save to server DB
    const serverOrder: ServerOrder = {
      ...order,
      id: orderId,
      status: order.status || 'pending',
      orderNumber,
    };

    const existingIndex = ordersDb.findIndex(o => o.id === orderId);
    if (existingIndex !== -1) {
      ordersDb[existingIndex] = serverOrder;
    } else {
      ordersDb.push(serverOrder);
    }

    saveOrders(ordersDb);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn("Telegram configuration is missing. Logging request instead.");
      console.log("Order data:", req.body);
      return res.status(200).json({ 
        success: true, 
        warning: "Конфігурація Telegram відсутня. Запит записано в лог на сервері.",
        order: serverOrder 
      });
    }

    try {
      let extrasText = [];
      if (serverOrder.hasLockedWheels) extrasText.push("🔒 Заблоковані колеса");
      if (serverOrder.hasSteeringIssue) extrasText.push("🕹️ Пошкоджене кермо");
      if (serverOrder.needsDitchPull) extrasText.push("🚜 Витягування з кювету");

      let host = (req.headers['x-forwarded-host'] as string) || req.get('host') || "localhost:3000";
      if (host.includes(',')) {
        host = host.split(',')[0].trim();
      }
      const protocol = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https' ? 'https' : 'http';
      const acceptUrl = `${protocol}://${host}/api/accept-order?id=${orderId}`;
      const confirmUrl = `${protocol}://${host}/api/confirm-order?id=${orderId}`;
      const completeUrl = `${protocol}://${host}/api/complete-order?id=${orderId}`;

      const isInvalidTelegramUrl = 
        confirmUrl.includes('localhost') || 
        confirmUrl.includes('127.0.0.1') || 
        confirmUrl.includes('0.0.0.0') || 
        confirmUrl.includes('::1');

      const message = `
🚨 *НОВИЙ ВИКЛИК ЕВАКУАТОРА* 🚨

🎫 *Номер замовлення:* ${serverOrder.orderNumber}
👤 *Клієнт:* ${serverOrder.name || "Гість"}
📞 *Телефон:* ${serverOrder.phone}
🏙️ *Місто:* ${serverOrder.city || "Не вказано"}
🚗 *Транспорт:* ${serverOrder.vehicleType || "Не вказано"}

📍 *Маршрут:*
• *Звідки:* ${serverOrder.fromLocation || "Не вказано"}
• *Куди:* ${serverOrder.toLocation || "Не вказано"}
🛣️ *Відстань:* ~${serverOrder.distance || 0} км

${extrasText.length > 0 ? `🛠️ *Особливості:* \n${extrasText.map(e => ` - ${e}`).join('\n')}\n` : ''}💰 *Розрахункова ціна:* *${serverOrder.estimatedPrice || 0} грн*

${isInvalidTelegramUrl ? `🔗 *Прийняти заявку:* ${acceptUrl}\n🔗 *Підтвердити виїзд:* ${confirmUrl}\n🏁 *Водій прибув:* ${completeUrl}` : `🔗 [Прийняти заявку](${acceptUrl})\n🔗 [Підтвердити виїзд евакуатора](${confirmUrl})\n🏁 [Водій прибув на місце події](${completeUrl})`}
      `.trim();

      const payload: any = {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        link_preview_options: {
          is_disabled: true
        }
      };

      if (!isInvalidTelegramUrl) {
        payload.reply_markup = {
          inline_keyboard: [
            [
              {
                "text": "🟢 ПРИЙНЯТИ ЗАЯВКУ",
                "url": acceptUrl
              }
            ],
            [
              {
                "text": "🚚 ПІДТВЕРДИТИ ВИЇЗД",
                "url": confirmUrl
              }
            ],
            [
              {
                "text": "🏁 ВОДІЙ ПРИБУВ НА МІСЦЕ",
                "url": completeUrl
              }
            ]
          ]
        };
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Telegram API responded with ${response.status}: ${errText}`);
      }

      res.status(200).json({ success: true, order: serverOrder });
    } catch (error: any) {
      console.error("Error sending message to Telegram:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Robust resolution: if __dirname contains 'dist', we are running inside dist/
    // Otherwise, we are running from root and need to append 'dist'
    const distPath = __dirname.endsWith('dist') || __dirname.includes('dist/') || __dirname.includes('dist\\')
      ? __dirname 
      : path.join(process.cwd(), 'dist');
    
    console.log(`[Production] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

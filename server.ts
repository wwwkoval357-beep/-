import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

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
  }

  let ordersDb: ServerOrder[] = [];
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
  app.post("/api/admin/update-order", (req, res) => {
    const { id, status, etaMinutes } = req.body;
    const order = ordersDb.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Замовлення не знайдено" });
    }
    
    if (status) {
      order.status = status;
      if (status === 'completed') {
        order.etaMinutes = 0;
        // Auto-remove completed orders after 2 minutes
        setTimeout(() => {
          ordersDb = ordersDb.filter(o => o.id !== id);
        }, 120000);
      }
    }
    
    if (typeof etaMinutes === 'number') {
      order.etaMinutes = etaMinutes;
    }
    
    res.json({ success: true, order, orders: ordersDb });
  });

  // Admin delete order
  app.post("/api/admin/delete-order", (req, res) => {
    const { id } = req.body;
    ordersDb = ordersDb.filter(o => o.id !== id);
    res.json({ success: true, orders: ordersDb });
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

    order.status = 'dispatched';
    order.etaMinutes = 15; // Set a default ETA of 15 minutes when dispatched

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
            Замовлення <span class="text-amber-500 font-mono font-bold">#${id.toString().toUpperCase()}</span> переведено в статус "Евакуатор виїхав на допомогу".
          </p>

          <div class="bg-slate-950/60 rounded-2xl p-4 mb-6 border border-slate-800/50 text-left space-y-2 text-xs text-slate-300">
            <div>Клієнт: <span class="font-bold text-white">${order.name}</span></div>
            <div>Телефон: <span class="font-bold text-white">${order.phone}</span></div>
            <div>Місто: <span class="font-bold text-white">${order.city || "Не вказано"}</span></div>
            <div>Авто: <span class="font-bold text-white">${order.vehicleType}</span></div>
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

    order.status = 'completed';
    order.etaMinutes = 0;

    // Auto-remove completed orders after 2 minutes
    setTimeout(() => {
      ordersDb = ordersDb.filter(o => o.id !== id);
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
            Замовлення <span class="text-white font-mono font-bold">#${id.toString().toUpperCase()}</span> успішно оновлено. Статус: "Евакуатор прибув на місце події".
          </p>

          <div class="bg-slate-950/60 rounded-2xl p-4 mb-6 border border-slate-800/50 text-left space-y-2 text-xs text-slate-300">
            <div>Клієнт: <span class="font-bold text-white">${order.name}</span></div>
            <div>Телефон: <span class="font-bold text-white">${order.phone}</span></div>
            <div>Місто: <span class="font-bold text-white">${order.city || "Не вказано"}</span></div>
            <div>Адреса події: <span class="font-bold text-white">${order.fromLocation}</span></div>
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

${isInvalidTelegramUrl ? `🔗 *Підтвердити виїзд:* ${confirmUrl}\n🏁 *Водій прибув:* ${completeUrl}` : `🔗 [Підтвердити виїзд евакуатора](${confirmUrl})\n🏁 [Водій прибув на місце події](${completeUrl})`}
      `.trim();

      const payload: any = {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      };

      if (!isInvalidTelegramUrl) {
        payload.reply_markup = {
          inline_keyboard: [
            [
              {
                "text": "🟢 ПІДТВЕРДИТИ ВИЇЗД",
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

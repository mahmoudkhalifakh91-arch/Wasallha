
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    // تحميل المتغيرات من ملف .env محلياً ومن بيئة النظام (مثل Netlify)
    // نستخدم '' كبارامتر ثالث لتحميل المتغيرات التي لا تبدأ بـ VITE_
    // Fix: replaced process.cwd() with __dirname to resolve "Property 'cwd' does not exist on type 'Process'"
    const env = loadEnv(mode, __dirname, '');
    
    // البحث عن المفتاح في env أو process.env (Netlify يضعه في الأخير)
    const API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // استبدال process.env.API_KEY بالقيمة الفعلية أثناء الـ Build
        'process.env.API_KEY': JSON.stringify(API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

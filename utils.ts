
/**
 * وظيفة متقدمة لتطهير البيانات من أي مراجع دائرية
 */
export const stripFirestore = (data: any, seen = new WeakSet()): any => {
  if (data === null || data === undefined) return data;
  
  const type = typeof data;
  if (type !== 'object') return data;

  if (seen.has(data)) return undefined;

  if (typeof data.toMillis === 'function') return data.toMillis();
  if (typeof data.toDate === 'function') return data.toDate().getTime();
  
  if (data.id && data.path && (data.firestore || data._firestore || data._delegate)) {
    return data.path;
  }

  const isArray = Array.isArray(data);
  const proto = Object.getPrototypeOf(data);
  const isPlainObject = proto === null || proto === Object.prototype || data.constructor === Object;
  
  if (!isArray && !isPlainObject) {
    return undefined;
  }

  seen.add(data);

  if (isArray) {
    return data.map(item => stripFirestore(item, seen)).filter(val => val !== undefined);
  }

  const stripped: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (key.startsWith('_') || key.startsWith('$')) continue;
      
      const value = data[key];
      if (typeof value === 'function') continue;
      
      const cleanedValue = stripFirestore(value, seen);
      if (cleanedValue !== undefined) stripped[key] = cleanedValue;
    }
  }
  return stripped;
};

/**
 * حساب المسافة الفعلية عبر الطريق باستخدام OSRM API (طريق الأسفلت الحقيقي)
 */
export const getRoadDistance = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<{ distance: number, duration: number }> => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return { distance: 0, duration: 0 };
  
  try {
    // محاولة جلب المسار الحقيقي من محرك الخرائط المفتوح
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // OSRM يعطي المسافة بالمتر، نحولها لكيلومتر
      return {
        distance: parseFloat((data.routes[0].distance / 1000).toFixed(1)),
        duration: Math.ceil(data.routes[0].duration / 60)
      };
    }
    throw new Error('OSRM Fallback');
  } catch (error) {
    // في حال فشل الخدمة (أو عدم وجود تغطية دقيقة لبعض الطرق الفرعية)، نستخدم المسافة الجوية مع معامل "تعرج الطرق" (1.5x) للاقتراب من الواقع
    const straightDistance = calculateDistance(lat1, lon1, lat2, lon2);
    return { 
      distance: parseFloat((straightDistance * 1.5).toFixed(1)), 
      duration: Math.ceil(straightDistance * 3) 
    };
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * ضغط الصور بشكل قوي
 */
export const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => resolve(base64Str);
  });
};

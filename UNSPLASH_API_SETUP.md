# 📸 Configuración de Unsplash API para PetLove

## 🚀 Pasos para obtener tu API Key de Unsplash

### 1. **Crear cuenta en Unsplash Developers**
- Ve a: https://unsplash.com/developers
- Haz clic en "Register as a developer"
- Inicia sesión con tu cuenta de Unsplash (o crea una nueva)

### 2. **Crear una nueva aplicación**
- Una vez logueado, ve a: https://unsplash.com/oauth/applications
- Haz clic en "New Application"
- Acepta los términos de uso de la API
- Completa el formulario:
  - **Application name**: `PetLove App`
  - **Description**: `Aplicación web para gestión de mascotas con galería de imágenes`
  - **Website**: `http://localhost:5173` (o tu dominio)

### 3. **Obtener tu Access Key**
- Una vez creada la aplicación, verás tu **Access Key**
- Copia esta clave (se ve algo así: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`)

### 4. **Configurar en tu proyecto**
- Abre el archivo `.env` en la raíz de tu proyecto
- Reemplaza la línea:
  ```
  VITE_UNSPLASH_ACCESS_KEY=tu-unsplash-access-key-aqui
  ```
- Por:
  ```
  VITE_UNSPLASH_ACCESS_KEY=tu-access-key-real-aqui
  ```

### 5. **Reiniciar el servidor de desarrollo**
```bash
npm run dev
```

## 🎯 Características implementadas

### **Búsqueda inteligente**
```javascript
// Buscar imágenes de mascotas
const images = await imageApiService.searchImages('dogs cats pets', 10);

// Buscar por categoría específica
const dogImages = await imageApiService.getImages('unsplash', { 
  category: 'dogs', 
  count: 5 
});
```

### **Imágenes aleatorias de alta calidad**
```javascript
// Imagen aleatoria de mascotas
const randomImage = await imageApiService.getRandomImage(400, 300, 'pets');

// Para carrusel con variedad
const carouselImages = await imageApiService.getCarouselImages(5);
```

### **Integración con componentes**
```jsx
// El componente ClientAvatar ya usa Unsplash automáticamente
<ClientAvatar clientId={123} />

// OptimizedImage detecta URLs de Unsplash y las optimiza
<OptimizedImage 
  src="https://images.unsplash.com/photo-123..." 
  quality="high"
/>
```

## 📊 Límites de la API

### **Plan Gratuito (Demo)**
- ✅ **50 requests por hora**
- ✅ **Imágenes de alta calidad**
- ✅ **Búsqueda y categorías**
- ✅ **Uso comercial permitido**

### **Plan Plus ($99/mes)**
- ✅ **5,000 requests por hora**
- ✅ **Todas las características del plan gratuito**
- ✅ **Soporte prioritario**

## 🔧 Fallbacks implementados

Si la API de Unsplash no está disponible o configurada, el sistema automáticamente usa:

1. **Lorem Picsum** - Para imágenes generales
2. **Dog CEO API** - Para imágenes de perros
3. **The Cat API** - Para imágenes de gatos
4. **Imágenes locales** - Como último recurso

## 🎨 Ventajas de usar Unsplash

- ✅ **Calidad profesional**: Fotos de alta resolución
- ✅ **Variedad infinita**: Miles de imágenes nuevas diariamente
- ✅ **Optimización automática**: Diferentes tamaños y formatos
- ✅ **Búsqueda inteligente**: Encuentra exactamente lo que necesitas
- ✅ **Gratis para uso comercial**: Sin royalties ni atribución requerida

## 🚨 Solución de problemas

### **Error: "API key not configured"**
- Verifica que hayas copiado correctamente tu Access Key
- Asegúrate de que no haya espacios extra
- Reinicia el servidor de desarrollo

### **Error: "Rate limit exceeded"**
- Has superado las 50 requests por hora
- Espera una hora o considera upgradearte al plan Plus
- El sistema usará automáticamente imágenes de fallback

### **Imágenes no cargan**
- Verifica tu conexión a internet
- Revisa la consola del navegador para errores
- El sistema debería mostrar imágenes de fallback automáticamente

## 📝 Ejemplo de uso completo

```javascript
import imageApiService from './services/imageApiService';

// Obtener imágenes para la galería principal
const galleryImages = await imageApiService.searchImages('happy pets dogs cats', 12);

// Imagen destacada para el hero
const heroImage = await imageApiService.getRandomImage(1200, 600, 'cute pets');

// Carrusel de testimonios
const testimonialImages = await imageApiService.getCarouselImages(6);
```

¡Ya tienes configurado Unsplash en tu aplicación PetLove! 🎉
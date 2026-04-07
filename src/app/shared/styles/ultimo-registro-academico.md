# Clases Globales para Último Registro Académico

Este documento describe todas las clases CSS globales disponibles para mostrar el último registro académico de forma consistente en toda la aplicación.

## 📋 Clases Principales

### `.ultimo-registro-card`
Contenedor principal de la tarjeta del último registro académico.
- **Uso**: Aplicar a `<mat-card>`
- **Características**: Fondo, bordes, padding y sombra consistentes

### `.ultimo-registro-grid`
Grid responsivo para los elementos del registro.
- **Uso**: Contenedor de los items de registro
- **Comportamiento**: Auto-fit con mínimo de 200px por columna

### `.registro-item`
Item individual dentro del grid de registro.
- **Uso**: Contenedor para cada campo (período, curso, nota, etc.)
- **Características**: Fondo, padding, bordes y efectos hover

## 🏷️ Clases de Contenido

### `.registro-label`
Etiqueta descriptiva del campo.
- **Estilo**: Texto pequeño, mayúsculas, color secundario
- **Uso**: Para "PERÍODO", "CURSO", "NOTA", etc.

### `.registro-value`
Valor del campo de registro.
- **Estilo**: Texto más grande, negrita, color principal
- **Uso**: Para mostrar los datos reales

## 📝 Clases de Información Adicional

### `.registro-lienal`
Sección de nota mínima aprobatoria.
- **Estilo**: Fondo azul, texto centrado, bordes redondeados
- **Uso**: Para mostrar información de nota mínima

## ⚠️ Clases de Alertas

### `.curso-warning`
Alerta de advertencia (color amarillo/naranja).
- **Uso**: Para mensajes informativos o advertencias leves

### `.curso-calificacion`
Alerta de información positiva (color azul).
- **Uso**: Para mostrar información sobre calificaciones

### `.curso-danger`
Alerta de error o peligro (color rojo).
- **Uso**: Para errores, deudas, o situaciones críticas

## 📱 Responsive Design

Las clases incluyen breakpoints automáticos:
- **≤ 768px**: Grid de 1 columna, padding reducido
- **≤ 480px**: Espaciado mínimo, iconos más pequeños

## 🔧 Estructura HTML Recomendada

```html
<mat-card class="ultimo-registro-card">
  <mat-card-header>
    <mat-icon mat-card-avatar>history</mat-icon>
    <mat-card-title>Último Registro Académico</mat-card-title>
  </mat-card-header>
  
  <mat-card-content>
    <div class="ultimo-registro-grid">
      
      <div class="registro-item">
        <mat-icon>calendar_today</mat-icon>
        <div>
          <div class="registro-label">Período</div>
          <div class="registro-value">2024-1</div>
        </div>
      </div>
      
      <div class="registro-item">
        <mat-icon>book</mat-icon>
        <div>
          <div class="registro-label">Curso</div>
          <div class="registro-value">Inglés Intermedio</div>
        </div>
      </div>
      
      <!-- Más items... -->
      
    </div>
  </mat-card-content>
</mat-card>

<!-- Información adicional -->
<div class="registro-lienal">
  Nota mínima aprobatoria: 14
</div>

<!-- Alertas condicionales -->
<div class="curso-warning">
  <mat-icon>warning</mat-icon>
  El curso no está cerrado aún. Las notas podrían variar.
</div>

<div class="curso-danger">
  <mat-icon>error</mat-icon>
  No puedes matricularte porque tienes deudas pendientes.
</div>
```

## 🎨 Tokens de Color Utilizados

Todas las clases utilizan tokens de Angular Material:
- `var(--mat-sys-primary)`
- `var(--mat-sys-surface-container)`
- `var(--mat-sys-on-surface)`
- `var(--mat-sys-error)`
- `var(--mat-sys-tertiary)`

## 📍 Ubicación

Estas clases están definidas en `src/styles.scss` como estilos globales, por lo que están disponibles en toda la aplicación sin necesidad de importar archivos adicionales.

## ✅ Componentes que las Utilizan

- **Registro de Matrícula** (`registro-matricula.component.ts`)
- **Compra de Libros** (`compra-libros.component.ts`)
- Cualquier componente futuro que necesite mostrar el último registro académico

## 🔄 Actualización

Para modificar estos estilos, edita únicamente el archivo `src/styles.scss` en la sección "ÚLTIMO REGISTRO ACADÉMICO - ESTILOS GLOBALES UNIFICADOS".

---

**Nota**: Todas las clases incluyen `!important` para garantizar la consistencia visual y evitar conflictos con otros estilos.
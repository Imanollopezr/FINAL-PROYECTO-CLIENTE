import Swal from 'sweetalert2';

class AlertService {
  // Alerta de éxito
  success(title, text = '', timer = 2000) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer,
      showConfirmButton: false
    });
  }

  // Alerta de error
  error(title, text = '', timer = 3000) {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      timer,
      showConfirmButton: false
    });
  }

  // Alerta de advertencia
  warning(title, text = '', timer = 2000) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      timer,
      showConfirmButton: false
    });
  }

  // Alerta de información
  info(title, text = '', timer = 2000) {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      timer,
      showConfirmButton: false
    });
  }

  // Confirmación de eliminación
  confirmDelete(title = '¿Estás seguro?', text = 'Esta acción no se puede deshacer') {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  }

  // Confirmación personalizada
  confirm(title, text, confirmText = 'Sí', cancelText = 'No') {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });
  }

  // Alerta de carga
  loading(title = 'Cargando...', text = 'Por favor espera') {
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Cerrar alerta de carga
  close() {
    Swal.close();
  }
}

export default new AlertService();
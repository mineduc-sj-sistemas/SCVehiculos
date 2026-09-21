document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal-create-user')
  const btnOpen = document.getElementById('btn-open-create-user')
  const btnClose = document.getElementById('btn-close-user-modal')
  const btnCancel = document.getElementById('btn-cancel-user-modal')
  const form = document.getElementById('form-create-user') as HTMLFormElement | null
  const errorBox = document.getElementById('user-form-error')
  const btnSubmit = document.getElementById('btn-submit-user') as HTMLButtonElement | null

  function openModal() {
    if (!modal) return
    modal.classList.remove('opacity-0', 'pointer-events-none')
    modal.classList.add('opacity-100')
    form?.reset()
    if (errorBox) {
      errorBox.classList.add('hidden')
      errorBox.textContent = ''
    }
  }

  function closeModal() {
    if (!modal) return
    modal.classList.add('opacity-0', 'pointer-events-none')
    modal.classList.remove('opacity-100')
  }

  btnOpen?.addEventListener('click', openModal)
  btnClose?.addEventListener('click', closeModal)
  btnCancel?.addEventListener('click', closeModal)

  // Cerrar al presionar backdrop
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const nombre = String(formData.get('nombre') || '').trim()
    const apellido = String(formData.get('apellido') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const dni = String(formData.get('dni') || '').trim()
    const telefono = String(formData.get('telefono') || '').trim()
    const rolId = Number(formData.get('rolId'))
    const dependenciaId = formData.get('dependenciaId') ? Number(formData.get('dependenciaId')) : null
    const password = String(formData.get('password') || '')
    const passwordConfirm = String(formData.get('password_confirm') || '')

    if (errorBox) {
      errorBox.classList.add('hidden')
      errorBox.textContent = ''
    }

    if (password !== passwordConfirm) {
      if (errorBox) {
        errorBox.textContent = 'Las contraseñas ingresadas no coinciden.'
        errorBox.classList.remove('hidden')
      }
      return
    }

    if (password.length < 6) {
      if (errorBox) {
        errorBox.textContent = 'La contraseña debe tener al menos 6 caracteres.'
        errorBox.classList.remove('hidden')
      }
      return
    }

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true
        btnSubmit.textContent = 'Guardando...'
      }

      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          dni,
          telefono,
          rolId,
          dependenciaId,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar el usuario.')
      }

      // Éxito: recargar página para visualizar en la lista
      window.location.reload()
    } catch (err: any) {
      if (errorBox) {
        errorBox.textContent = err.message || 'Ocurrió un error inesperado al guardar.'
        errorBox.classList.remove('hidden')
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false
        btnSubmit.textContent = 'Guardar Usuario'
      }
    }
  })
})

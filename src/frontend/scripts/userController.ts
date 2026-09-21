document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal-create-user')
  const btnOpen = document.getElementById('btn-open-create-user')
  const btnClose = document.getElementById('btn-close-user-modal')
  const btnCancel = document.getElementById('btn-cancel-user-modal')
  const form = document.getElementById('form-create-user') as HTMLFormElement | null
  const errorBox = document.getElementById('user-form-error')
  const btnSubmit = document.getElementById('btn-submit-user') as HTMLButtonElement | null

  // Elementos específicos de vinculación de chofer
  const selectRol = document.getElementById('user-rol') as HTMLSelectElement | null
  const containerChofer = document.getElementById('container-chofer-selector')
  const selectChofer = document.getElementById('user-chofer-id') as HTMLSelectElement | null

  // Inputs para autocompletado
  const inputNombre = document.getElementById('user-nombre') as HTMLInputElement | null
  const inputApellido = document.getElementById('user-apellido') as HTMLInputElement | null
  const inputDni = document.getElementById('user-dni') as HTMLInputElement | null
  const inputTelefono = document.getElementById('user-telefono') as HTMLInputElement | null
  const inputEmail = document.getElementById('user-email') as HTMLInputElement | null

  function updateChoferVisibility() {
    if (!selectRol || !containerChofer) return
    const isChofer = selectRol.value === '4' // Rol ID 4 = Chofer
    if (isChofer) {
      containerChofer.classList.remove('hidden')
      if (selectChofer) selectChofer.required = true
    } else {
      containerChofer.classList.add('hidden')
      if (selectChofer) {
        selectChofer.required = false
        selectChofer.value = ''
      }
    }
  }

  // Cambio de rol dinámico
  selectRol?.addEventListener('change', updateChoferVisibility)

  // Autocompletado al seleccionar un chofer
  selectChofer?.addEventListener('change', () => {
    const selectedOption = selectChofer.selectedOptions[0]
    if (!selectedOption || !selectedOption.value) return

    const { nombre, apellido, dni, email, telefono } = selectedOption.dataset
    if (nombre && inputNombre) inputNombre.value = nombre
    if (apellido && inputApellido) inputApellido.value = apellido
    if (dni && inputDni) inputDni.value = dni
    if (telefono && inputTelefono) inputTelefono.value = telefono
    if (email && inputEmail && !inputEmail.value) {
      inputEmail.value = email
    }
  })

  function openModal() {
    if (!modal) return
    modal.classList.remove('opacity-0', 'pointer-events-none')
    modal.classList.add('opacity-100')
    form?.reset()
    updateChoferVisibility()
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
    const choferId = formData.get('choferId') ? Number(formData.get('choferId')) : null
    const password = String(formData.get('password') || '')
    const passwordConfirm = String(formData.get('password_confirm') || '')

    if (errorBox) {
      errorBox.classList.add('hidden')
      errorBox.textContent = ''
    }

    if (rolId === 4 && !choferId) {
      if (errorBox) {
        errorBox.textContent = 'Debes seleccionar un chofer del padrón para vincularle credenciales de acceso.'
        errorBox.classList.remove('hidden')
      }
      return
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
          choferId,
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


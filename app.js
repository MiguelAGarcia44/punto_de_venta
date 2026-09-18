
// 1. FUNCIÓN DE NAVEGACIÓN Y CARGA DE ID
  function cambiarPestana(idVista) {
    document.getElementById('vista-consulta').style.display = 'none';
    document.getElementById('vista-agregar').style.display = 'none';
    document.getElementById('vista-modificar').style.display = 'none';
    document.getElementById('vista-venta').style.display = 'none';
    
    document.getElementById(idVista).style.display = 'block';

    // MAGIA AQUÍ: Si el usuario entra a agregar, calculamos el nuevo ID en tiempo real
    if (idVista === 'vista-agregar') {
      document.getElementById('id_producto_agregar').value = "Calculando...";
      
      google.script.run
        .withSuccessHandler(function(nuevoId) {
          document.getElementById('id_producto_agregar').value = nuevoId;
        })
        .obtenerSiguienteId();
    }
  }

// 2. RECOPILAR Y GUARDAR
  function procesarGuardadoAgregar() {
    const datos = {
      id_producto: document.getElementById('id_producto_agregar').value.trim(),
      codigo_de_barras: document.getElementById('codigo_de_barras_agregar').value.trim(),
      tipo_producto: document.getElementById('tipo_producto_agregar').value.trim(),
      nombre_producto: document.getElementById('nombre_producto_agregar').value.trim(),
      marca_producto: document.getElementById('marca_producto_agregar').value.trim(),
      precio_unitario_proveedor: document.getElementById('precio_unitario_proveedor_agregar').value.trim(),
      precio_caja_proveedor: document.getElementById('precio_caja_proveedor_agregar').value.trim(),
      precio_venta_unitario: document.getElementById('precio_venta_unitario_agregar').value.trim(),
      precio_venta_caja: document.getElementById('precio_venta_caja_agregar').value.trim(),
      ubicacion_fisica: document.getElementById('ubicacion_fisica_agregar').value.trim(),
      stock_cajas: document.getElementById('stock_cajas_agregar').value.trim(),
      stock_unidades: document.getElementById('stock_unidades_agregar').value.trim(),
      punto_reorden: document.getElementById('punto_reorden_agregar').value.trim()
    };

    if (datos.tipo_producto === "" || datos.nombre_producto === "" || datos.precio_venta_unitario === "") {
      return alert("Por favor, llena los campos obligatorios (*).");
    }

    google.script.run
      .withSuccessHandler(function(respuesta) {
        alert(respuesta);
        document.getElementById('formulario_agregar').reset();
        // Generamos el siguiente ID inmediatamente para que puedan seguir capturando
        cambiarPestana('vista-agregar'); 
      })
      .withFailureHandler(function(error) {
        alert("Error al guardar: " + error.message);
      })
      .guardarProducto(datos);
  }
// Limpia todos los campos para registrar un artículo nuevo
function limpiarFormulario() {
  document.getElementById('formulario_producto').reset();
  document.getElementById('buscar_modificar').value = '';
}

// (Opcional por ahora) Función que prepararemos para buscar y rellenar los datos
function buscarProductoParaEdicion() {
  const criterio = document.getElementById('buscar_modificar').value.trim();
  if(!criterio) return;
  // Aquí conectaremos la función de lectura que hicimos en el backend 
  // para rellenar los inputs automáticamente cuando encuentres un código.
  console.log("Buscando producto: " + criterio);
}

// Variable temporal para guardar los resultados de la búsqueda
  let resultadosLocalesModificar = [];

  // 1. Ejecutar Búsqueda
  function ejecutarBusquedaModificar() {
    const tipo = document.getElementById('tipo_busqueda_modificar').value;
    const termino = document.getElementById('termino_busqueda_modificar').value.trim();

    if (termino === "") {
      return alert("Por favor ingresa un término para buscar.");
    }

    // Mostrar tabla temporalmente con estado de carga
    document.getElementById('tabla_resultados_modificar').innerHTML = "<tr><td colspan='4'>Buscando...</td></tr>";
    document.getElementById('contenedor_resultados_modificar').style.display = 'block';
    document.getElementById('contenedor_formulario_modificar').style.display = 'none';

    // Llamar al backend
    google.script.run
      .withSuccessHandler(mostrarResultadosModificar)
      .withFailureHandler(function(error) {
        alert("Error en la búsqueda: " + error.message);
      })
      .buscarProductosParaEdicion(tipo, termino);
  }

  // 2. Mostrar Resultados en la Tabla
  function mostrarResultadosModificar(resultados) {
    resultadosLocalesModificar = resultados; // Guardamos en memoria para usarlos al seleccionar
    const tbody = document.getElementById('tabla_resultados_modificar');
    tbody.innerHTML = ""; // Limpiar tabla

    if (resultados.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>No se encontraron productos con esa búsqueda.</td></tr>";
      return;
    }

    // Crear una fila por cada resultado
    resultados.forEach(producto => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ccc;">${producto.id_producto || ''}</td>
        <td style="padding: 10px; border: 1px solid #ccc;">${producto.nombre_producto || ''}</td>
        <td style="padding: 10px; border: 1px solid #ccc;">$${producto.precio_venta_unitario || 0}</td>
        <td style="padding: 10px; border: 1px solid #ccc; text-align: center;">
          <button type="button" class="nav-btn" style="padding: 5px 10px; font-size: 14px; background-color: #2980b9;" onclick="seleccionarProductoParaModificar('${producto.id_producto}')">Seleccionar</button>
        </td>
      `;
      tbody.appendChild(fila);
    });
  }

  // 3. Llenar el formulario con el producto seleccionado
  function seleccionarProductoParaModificar(idSeleccionado) {
    const producto = resultadosLocalesModificar.find(p => String(p.id_producto) === String(idSeleccionado));
  
    // Le agregué esta alerta por si acaso, para que el sistema deje de quedarse "callado" si hay un error
    if (!producto) {
      alert("Error interno: No se pudo encontrar el producto en la memoria.");
      return; 
    }

    // Ocultar la tabla y mostrar el formulario
    document.getElementById('contenedor_resultados_modificar').style.display = 'none';
    document.getElementById('contenedor_formulario_modificar').style.display = 'block';

    // Rellenar campos exactos (Nota cómo inyectamos los datos en las variables _modificar)
    document.getElementById('id_producto_modificar').value = producto.id_producto || "";
    document.getElementById('codigo_de_barras_modificar').value = producto.codigo_de_barras || "";
    document.getElementById('tipo_producto_modificar').value = producto.tipo_producto || "";
    document.getElementById('nombre_producto_modificar').value = producto.nombre_producto || "";
    document.getElementById('marca_producto_modificar').value = producto.marca_producto || "";
    document.getElementById('precio_unitario_proveedor_modificar').value = producto.precio_unitario_proveedor || "";
    document.getElementById('precio_caja_proveedor_modificar').value = producto.precio_caja_proveedor || "";
    document.getElementById('precio_venta_unitario_modificar').value = producto.precio_venta_unitario || "";
    document.getElementById('precio_venta_caja_modificar').value = producto.precio_venta_caja || "";
    document.getElementById('ubicacion_fisica_modificar').value = producto.ubicacion_fisica || "";
    document.getElementById('stock_cajas_modificar').value = producto.stock_cajas || "";
    document.getElementById('stock_unidades_modificar').value = producto.stock_unidades || "";
    document.getElementById('punto_reorden_modificar').value = producto.punto_reorden || "";
  }

  // 4. Guardar los cambios (Actualizar)
  function procesarGuardadoModificar() {
    const datos = {
      id_producto: document.getElementById('id_producto_modificar').value.trim(),
      codigo_de_barras: document.getElementById('codigo_de_barras_modificar').value.trim(),
      tipo_producto: document.getElementById('tipo_producto_modificar').value.trim(),
      nombre_producto: document.getElementById('nombre_producto_modificar').value.trim(),
      marca_producto: document.getElementById('marca_producto_modificar').value.trim(),
      precio_unitario_proveedor: document.getElementById('precio_unitario_proveedor_modificar').value.trim(),
      precio_caja_proveedor: document.getElementById('precio_caja_proveedor_modificar').value.trim(),
      precio_venta_unitario: document.getElementById('precio_venta_unitario_modificar').value.trim(),
      precio_venta_caja: document.getElementById('precio_venta_caja_modificar').value.trim(),
      ubicacion_fisica: document.getElementById('ubicacion_fisica_modificar').value.trim(),
      stock_cajas: document.getElementById('stock_cajas_modificar').value.trim(),
      stock_unidades: document.getElementById('stock_unidades_modificar').value.trim(),
      punto_reorden: document.getElementById('punto_reorden_modificar').value.trim()
    };

    if (datos.tipo_producto === "" || datos.nombre_producto === "" || datos.precio_venta_unitario === "") {
      return alert("Por favor, llena los campos obligatorios (*).");
    }

    // Usamos EXACTAMENTE la misma función del backend que usamos para agregar
    // Porque la construimos de forma inteligente: si encuentra el ID, actualiza en lugar de crear.
    google.script.run
      .withSuccessHandler(function(respuesta) {
        alert(respuesta);
        // Limpiamos y ocultamos el formulario para buscar otro
        document.getElementById('formulario_modificar').reset();
        document.getElementById('contenedor_formulario_modificar').style.display = 'none';
        document.getElementById('termino_busqueda_modificar').value = '';
      })
      .withFailureHandler(function(error) {
        alert("Error al actualizar: " + error.message);
      })
      .guardarProducto(datos); 
  }


// ====== MÓDULO DE CONSULTA ======
  let resultadosLocalesConsulta = [];

  // Truco para pistolas de código de barras: Buscar automáticamente al presionar 'Enter'
  function manejarEnterConsulta(event) {
    if (event.key === 'Enter') {
      ejecutarBusquedaConsulta();
    }
  }

  // --- FUNCIONES DE CÁMARA (Ocultas) ---
  
  // 1. Simula un clic en el botón de archivo para abrir la cámara
  function abrirCamaraConsulta() {
    document.getElementById('lector_camara_consulta').click();
  }

// 2. Recibe la foto, la analiza y busca el producto
  function procesarFotoCodigo(event) {
    const archivo = event.target.files[0];
    if (!archivo) return; 

    const inputBusqueda = document.getElementById('termino_busqueda_consulta');
    inputBusqueda.value = "Leyendo foto...";

    try {
      const html5QrCode = new Html5Qrcode("lector_falso");

      html5QrCode.scanFile(archivo, true)
        .then(codigoDescifrado => {
          inputBusqueda.value = codigoDescifrado;
          document.getElementById('tipo_busqueda_consulta').value = "codigo";
          ejecutarBusquedaConsulta();
        })
        .catch(error => {
          inputBusqueda.value = "";
          // El error más común es que no encuentra el código en la foto
          alert("No se detectó un código de barras claro. Intenta con mejor luz o enfoca solo el código.");
          console.log(error);
        });
    } catch (err) {
      inputBusqueda.value = "";
      alert("Error en el sistema de lectura: " + err.message);
    }

    event.target.value = '';
  }

  // 1. Ejecutar la búsqueda
  function ejecutarBusquedaConsulta() {
    const tipo = document.getElementById('tipo_busqueda_consulta').value;
    const termino = document.getElementById('termino_busqueda_consulta').value.trim();

    if (termino === "") return alert("Por favor ingresa un código o nombre.");

    // Limpiamos la pantalla
    document.getElementById('contenedor_tabla_consulta').style.display = 'none';
    document.getElementById('tarjeta_producto_consulta').style.display = 'none';

    // ¡RECICLAMOS LA FUNCIÓN DEL BACKEND!
    google.script.run
      .withSuccessHandler(function(resultados) {
        resultadosLocalesConsulta = resultados;
        procesarResultadosConsulta(tipo);
      })
      .withFailureHandler(function(error) {
        alert("Error al buscar: " + error.message);
      })
      .buscarProductosParaEdicion(tipo, termino);
  }

  // 2. Decidir qué pantalla mostrar
  function procesarResultadosConsulta(tipo) {
    if (resultadosLocalesConsulta.length === 0) {
      alert("No se encontró ningún producto.");
      return;
    }

    // Si buscamos por código O si solo hay 1 resultado exacto -> Mostrar la tarjeta directo
    if (tipo === 'codigo' || resultadosLocalesConsulta.length === 1) {
      mostrarTarjetaConsulta(resultadosLocalesConsulta[0].id_producto);
    } 
    // Si buscamos por nombre y hay varios -> Mostrar la tabla
    else {
      const tbody = document.getElementById('tabla_resultados_consulta');
      tbody.innerHTML = "";

      resultadosLocalesConsulta.forEach(producto => {
        const fila = document.createElement('tr');
        
        // TRUCO UX: Hacemos que toda la fila funcione como un botón gigante
        fila.style.cursor = 'pointer';
        fila.onclick = function() { mostrarTarjetaConsulta(producto.id_producto); };
        
        // Agregamos un efecto visual rápido para que sepan que se puede hacer clic
        fila.onmouseover = function() { this.style.backgroundColor = '#f1c40f'; };
        fila.onmouseout = function() { this.style.backgroundColor = 'transparent'; };

        fila.innerHTML = `
          <td style="padding: 10px; border: 1px solid #ccc;">${producto.codigo_de_barras || '-'}</td>
          <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold;">${producto.nombre_producto || '-'}</td>
          <td style="padding: 10px; border: 1px solid #ccc; color: #27ae60; font-weight: bold;">$${producto.precio_venta_unitario || '0'}</td>
          <td style="padding: 10px; border: 1px solid #ccc; color: #2980b9; font-weight: bold;">$${producto.precio_venta_caja || '0'}</td>
        `;
        tbody.appendChild(fila);
      });
      document.getElementById('contenedor_tabla_consulta').style.display = 'block';
    }
  }

  // 3. Pintar la tarjeta grande
  function mostrarTarjetaConsulta(idSeleccionado) {
    const producto = resultadosLocalesConsulta.find(p => String(p.id_producto) === String(idSeleccionado));
    if (!producto) return;

    // Ocultar la tabla y encender la tarjeta
    document.getElementById('contenedor_tabla_consulta').style.display = 'none';
    document.getElementById('tarjeta_producto_consulta').style.display = 'block';

    // Inyectar los datos visuales
    document.getElementById('lbl_nombre_consulta').innerText = producto.nombre_producto || 'Sin Nombre';
    document.getElementById('lbl_id_consulta').innerText = "Cód: " + (producto.codigo_de_barras || producto.id_producto);
    document.getElementById('lbl_precio_consulta').innerText = "$" + (producto.precio_venta_unitario || '0');
    document.getElementById('lbl_precio_caja_consulta').innerText = "$" + (producto.precio_venta_caja || '0');
    document.getElementById('lbl_ubicacion_consulta').innerText = producto.ubicacion_fisica || 'Sin asignar';
    document.getElementById('lbl_stock_consulta').innerText = `${producto.stock_unidades || 0} Unidades / ${producto.stock_cajas || 0} Cajas`;

    // Truco de UX: Limpiar la barra y enfocarla para que puedan seguir escaneando sin usar el mouse
    const inputBusqueda = document.getElementById('termino_busqueda_consulta');
    inputBusqueda.value = "";
    inputBusqueda.focus();
  }

// ==========================================
  // --- CÁMARA PARA AGREGAR NUEVO PRODUCTO ---
  // ==========================================
  function abrirCamaraAgregar() {
    document.getElementById('lector_camara_agregar').click();
  }

  function procesarFotoAgregar(event) {
    const archivo = event.target.files[0];
    if (!archivo) return; 

    const inputCodigo = document.getElementById('codigo_de_barras_agregar');
    inputCodigo.value = "Leyendo...";

    try {
      const html5QrCode = new Html5Qrcode("lector_falso_agregar");
      html5QrCode.scanFile(archivo, true)
        .then(codigoDescifrado => {
          inputCodigo.value = codigoDescifrado; // Solo lo escribe, no busca
        })
        .catch(error => {
          inputCodigo.value = "";
          alert("No se detectó un código claro en la foto.");
        });
    } catch (err) {
      inputCodigo.value = "";
      alert("Error: " + err.message);
    }
    event.target.value = '';
  }


  // ==========================================
  // --- CÁMARA PARA MODIFICAR (BUSCADOR) ---
  // ==========================================
  function abrirCamaraModificar() {
    document.getElementById('lector_camara_modificar').click();
  }

  function procesarFotoModificar(event) {
    const archivo = event.target.files[0];
    if (!archivo) return; 

    const inputBusqueda = document.getElementById('termino_busqueda_modificar');
    inputBusqueda.value = "Leyendo...";

    try {
      const html5QrCode = new Html5Qrcode("lector_falso_modificar");
      html5QrCode.scanFile(archivo, true)
        .then(codigoDescifrado => {
          inputBusqueda.value = codigoDescifrado;
          document.getElementById('tipo_busqueda_modificar').value = "codigo";
          ejecutarBusquedaModificar(); // Escribe y busca automáticamente
        })
        .catch(error => {
          inputBusqueda.value = "";
          alert("No se detectó un código claro en la foto.");
        });
    } catch (err) {
      inputBusqueda.value = "";
      alert("Error: " + err.message);
    }
    event.target.value = '';
  }



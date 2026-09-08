export const generarTicketTraslado = (traslado) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes para imprimir el ticket.");
    return;
  }

  const fecha = new Date(traslado.fecha_traslado).toLocaleString();

  let productosHTML = '';
  if (traslado.detalles && traslado.detalles.length > 0) {
    traslado.detalles.forEach((det) => {
      productosHTML += `
        <tr>
          <td style="padding: 5px; border-bottom: 1px dashed #ccc;">${det.repuesto_codigo || ''}</td>
          <td style="padding: 5px; border-bottom: 1px dashed #ccc;">${det.repuesto_nombre}</td>
          <td style="padding: 5px; border-bottom: 1px dashed #ccc;">${det.ubicacion_origen_nombre}</td>
          <td style="padding: 5px; border-bottom: 1px dashed #ccc;">${det.ubicacion_destino_nombre}</td>
          <td style="padding: 5px; text-align: center; border-bottom: 1px dashed #ccc;">${det.cantidad}</td>
        </tr>
      `;
    });
  }

  const htmlContent = `
    <html>
      <head>
        <title>Nota de Traslado #${traslado.id}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 20px;
            width: 100%;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }
          h2 { text-align: center; margin-bottom: 5px; }
          .info { margin-bottom: 15px; }
          .info p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { border-bottom: 2px solid #000; padding: 5px; text-align: left; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; }
          
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <h2>NOTA DE TRASLADO</h2>
        <h3 style="text-align: center; margin-top: 0;">Nro: ${traslado.id.toString().padStart(6, '0')}</h3>
        
        <div class="info">
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Usuario:</strong> ${traslado.usuario_nombre}</p>
          <p><strong>Almacén Origen:</strong> ${traslado.almacen_origen_nombre}</p>
          <p><strong>Almacén Destino:</strong> ${traslado.almacen_destino_nombre}</p>
          <p><strong>Observaciones:</strong> ${traslado.observaciones || 'Ninguna'}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Ubi. Origen</th>
              <th>Ubi. Destino</th>
              <th style="text-align: center;">Cant.</th>
            </tr>
          </thead>
          <tbody>
            ${productosHTML}
          </tbody>
        </table>

        <div class="footer">
          <p>Firma Entregado</p>
          <br/><br/><br/>
          <p>_______________________</p>
          <p>Firma Recibido</p>
          <br/><br/><br/>
          <p>_______________________</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Esperar un momento para asegurar que el DOM esté listo antes de imprimir
  setTimeout(() => {
    printWindow.print();
    // printWindow.close(); // Opcional, cerrar despues de imprimir
  }, 250);
};

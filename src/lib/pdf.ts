import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateTicketPDF(booking: any) {
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.background = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'sans-serif';

  const date = new Date(booking.schedules?.departure_time || Date.now());
  const dateString = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let passengersHtml = '';
  booking.booking_passengers?.forEach((p: any) => {
    passengersHtml += `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <div>
          <div style="font-weight: bold; color: #333;">${p.passenger_name}</div>
          <div style="font-size: 12px; color: #777;">IC/Passport: ${p.passenger_ic || 'N/A'}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #777;">Seat</div>
          <div style="font-weight: bold; font-size: 16px; color: #E11D48;">${p.seats?.seat_number || 'TBA'}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div style="border: 2px solid #E11D48; border-radius: 12px; overflow: hidden; display: flex;">
      <!-- Left part -->
      <div style="flex: 1; padding: 30px; border-right: 2px dashed #E11D48; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #E11D48; font-size: 28px; font-weight: 900; letter-spacing: -1px;">redBus</h2>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #777; text-transform: uppercase; font-weight: bold;">Booking Ref</div>
            <div style="font-size: 20px; font-family: monospace; font-weight: bold;">${booking.booking_reference}</div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 20px; rounded-lg: 8px;">
          <div>
            <div style="font-size: 12px; color: #777; text-transform: uppercase;">Origin</div>
            <div style="font-size: 24px; font-weight: bold; color: #0f172a;">${booking.schedules?.routes?.origin || 'Unknown'}</div>
          </div>
          <div style="text-align: center; color: #E11D48; font-weight: bold;">
            <div style="margin-bottom: 4px;">→</div>
            <div style="font-size: 12px; padding: 2px 8px; background: #ffe4e6; border-radius: 12px;">Direct</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #777; text-transform: uppercase;">Destination</div>
            <div style="font-size: 24px; font-weight: bold; color: #0f172a;">${booking.schedules?.routes?.destination || 'Unknown'}</div>
          </div>
        </div>

        <div style="display: flex; gap: 40px; margin-bottom: 30px;">
          <div>
            <div style="font-size: 12px; color: #777; text-transform: uppercase;">Departure Date</div>
            <div style="font-weight: bold; font-size: 16px;">${dateString}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #777; text-transform: uppercase;">Departure Time</div>
            <div style="font-weight: bold; font-size: 16px;">${timeString}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #777; text-transform: uppercase;">Status</div>
            <div style="font-weight: bold; font-size: 16px; color: #16a34a; text-transform: uppercase;">${booking.status}</div>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <h3 style="font-size: 14px; color: #777; text-transform: uppercase; margin-bottom: 10px;">Passengers</h3>
          ${passengersHtml}
        </div>
      </div>
      
      <!-- Right part -->
      <div style="width: 250px; background: #E11D48; color: white; padding: 30px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; margin-bottom: 4px;">Present to Operator</div>
          <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block;">
             <!-- Fake QR Code representation -->
             <div style="width: 100px; height: 100px; background: repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px);"></div>
          </div>
        </div>
        <div style="font-family: monospace; font-size: 18px; margin-bottom: 20px;">${booking.booking_reference}</div>
        <div style="font-size: 12px; opacity: 0.8;">Thank you for choosing redBus!</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Ticket_${booking.booking_reference}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateInvoicePDF(booking: any) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.background = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'sans-serif';

  const date = new Date(booking.created_at || Date.now());
  const dateString = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  container.innerHTML = `
    <div style="padding: 40px; border: 1px solid #ddd; max-width: 800px; margin: 0 auto; color: #333;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #E11D48; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="color: #E11D48; margin: 0; font-size: 32px; font-weight: 900;">INVOICE</h1>
          <div style="margin-top: 10px; color: #777;">redBusPlatform</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #777;">Invoice Date</div>
          <div style="font-weight: bold; margin-bottom: 10px;">${dateString}</div>
          <div style="font-size: 12px; color: #777;">Booking Ref</div>
          <div style="font-weight: bold;">${booking.booking_reference}</div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Billed To:</div>
          <div style="font-weight: bold; font-size: 16px;">${booking.profiles?.full_name || booking.client_id}</div>
          <div style="color: #555;">${booking.profiles?.email || ''}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Payment Status:</div>
          <div style="font-weight: bold; font-size: 16px; color: #16a34a; text-transform: uppercase;">PAID</div>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #64748b;">Description</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; color: #64748b;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px 12px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: bold;">Bus Ticket Reservation</div>
              <div style="font-size: 12px; color: #777; margin-top: 4px;">
                ${booking.schedules?.routes?.origin} to ${booking.schedules?.routes?.destination}<br/>
                ${booking.booking_passengers?.length || 1} Passenger(s)
              </div>
            </td>
            <td style="padding: 16px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
              RM ${Number(booking.total_amount).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #777;">Subtotal</span>
            <span>RM ${Number(booking.total_amount).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #777;">Tax (0%)</span>
            <span>RM 0.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 16px 0; font-size: 20px; font-weight: bold;">
            <span>Total</span>
            <span style="color: #E11D48;">RM ${Number(booking.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 50px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
        Thank you for your business!<br/>
        This is a computer generated invoice and requires no signature.
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Invoice_${booking.booking_reference}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

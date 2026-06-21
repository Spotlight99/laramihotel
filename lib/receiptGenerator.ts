import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  bookingId: number;
  invoiceNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  pricePerNight: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  hotelEmail?: string;
  issueDate?: string;
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  try {
    // Create a temporary container for the receipt HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';

    // Build the HTML receipt
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; color: #c9901a;">${data.hotelName || 'Kelvina Hotel'}</h1>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">
          ${data.hotelAddress || 'Port Harcourt, Nigeria'}
        </p>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">
          ${data.hotelPhone || 'Contact: Hotel'}
        </p>
        <hr style="border: none; border-top: 2px solid #c9901a; margin: 20px 0;" />
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; color: #1a472a;">BOOKING RECEIPT</h2>
        <p style="margin: 10px 0; font-size: 12px; color: #666;">
          Issue Date: ${data.issueDate || new Date().toLocaleDateString()}
        </p>
      </div>

      <div style="margin-bottom: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p style="margin: 5px 0; font-size: 13px;"><strong>Booking ID:</strong> BK${data.bookingId}</p>
        <p style="margin: 5px 0; font-size: 13px;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p style="margin: 5px 0; font-size: 13px;"><strong>Status:</strong> ${data.bookingStatus}</p>
        <p style="margin: 5px 0; font-size: 13px;"><strong>Payment Status:</strong> ${data.paymentStatus}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1a472a; border-bottom: 2px solid #c9901a; padding-bottom: 5px;">
          GUEST INFORMATION
        </h3>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Name:</strong> ${data.guestName}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Email:</strong> ${data.guestEmail}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Phone:</strong> ${data.guestPhone}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1a472a; border-bottom: 2px solid #c9901a; padding-bottom: 5px;">
          ROOM INFORMATION
        </h3>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Room Number:</strong> ${data.roomNumber}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Room Type:</strong> ${data.roomType}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Price per Night:</strong> ₦${data.pricePerNight.toLocaleString()}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1a472a; border-bottom: 2px solid #c9901a; padding-bottom: 5px;">
          STAY DATES
        </h3>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Check-in Date:</strong> ${data.checkInDate}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Check-out Date:</strong> ${data.checkOutDate}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Number of Nights:</strong> ${data.numberOfNights}</p>
      </div>

      <div style="margin-bottom: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: right;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1a472a;">TOTAL AMOUNT</h3>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #c9901a;">
          ₦${data.totalAmount.toLocaleString()}
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="margin: 5px 0; font-size: 11px; color: #666;">
          Thank you for choosing ${data.hotelName || 'Kelvina Hotel'}!
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #666;">
          For inquiries, please contact us or visit our website.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 10px; color: #999;">
          This receipt is valid only with the original booking confirmation.
        </p>
      </div>
    `;

    document.body.appendChild(container);

    // Convert HTML to Canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Get canvas dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Calculate pages
    let height = pdf.internal.pageSize.getHeight();
    let position = 0;

    while (position < imgHeight) {
      if (position > 0) {
        pdf.addPage();
      }
      position += height;
    }

    // Generate filename
    const filename = `booking-receipt-${data.bookingId}-${Date.now()}.pdf`;

    // Download PDF
    pdf.save(filename);

    return { success: true, filename };
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

export const downloadReceiptAsText = (data: ReceiptData) => {
  try {
    const text = `
KELVINA HOTEL
${data.hotelAddress || 'Port Harcourt, Nigeria'}
${data.hotelPhone || ''}

═══════════════════════════════════════════════════════════════════════
                            BOOKING RECEIPT
═══════════════════════════════════════════════════════════════════════

Date: ${data.issueDate || new Date().toLocaleDateString()}

─────────────────────────────────────────────────────────────────────
BOOKING DETAILS
─────────────────────────────────────────────────────────────────────
Booking ID:        BK${data.bookingId}
Invoice Number:    ${data.invoiceNumber}
Booking Status:    ${data.bookingStatus}
Payment Status:    ${data.paymentStatus}

─────────────────────────────────────────────────────────────────────
GUEST INFORMATION
─────────────────────────────────────────────────────────────────────
Name:              ${data.guestName}
Email:             ${data.guestEmail}
Phone:             ${data.guestPhone}

─────────────────────────────────────────────────────────────────────
ROOM INFORMATION
─────────────────────────────────────────────────────────────────────
Room Number:       ${data.roomNumber}
Room Type:         ${data.roomType}
Price per Night:   ₦${data.pricePerNight.toLocaleString()}

─────────────────────────────────────────────────────────────────────
STAY DATES
─────────────────────────────────────────────────────────────────────
Check-in Date:     ${data.checkInDate}
Check-out Date:    ${data.checkOutDate}
Number of Nights:  ${data.numberOfNights}

═══════════════════════════════════════════════════════════════════════
                            TOTAL AMOUNT
                          ₦${data.totalAmount.toLocaleString()}
═══════════════════════════════════════════════════════════════════════

Thank you for choosing Kelvina Hotel!
For inquiries, please contact us or visit our website.

This receipt is valid only with the original booking confirmation.
    `;

    // Create blob and download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-receipt-${data.bookingId}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error: any) {
    console.error('Error downloading text receipt:', error);
    return { success: false, error: error.message };
  }
};

// backend/utils/getInvoiceHTML.js

const getInvoiceHTML = (booking, workshop) => {
    // Defensive Programming: Create "safe" objects to avoid errors
    const safeBooking = booking || {};
    const safeWorkshop = workshop || {};
    const safeCustomer = safeBooking.customer || {};

    // Safely calculate costs with fallbacks to 0
    const serviceCost = safeBooking.totalCost ?? 0;
    const pickupDropoffCost = safeBooking.requestedPickupDropoff ? (safeBooking.pickupDropoffCost ?? 0) : 0;
    const subtotalBeforeDiscount = serviceCost + pickupDropoffCost;
    const discount = safeBooking.discountAmount ?? 0;
    const grandTotal = safeBooking.finalAmount ?? 0;

    // Format dates safely
    const invoiceDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const serviceDate = safeBooking.date 
        ? new Date(safeBooking.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

    // Safely handle the PAID stamp text
    const paymentMethodText = safeBooking.isPaid && safeBooking.paymentMethod
        ? `PAID via ${safeBooking.paymentMethod.toUpperCase()}`
        : (safeBooking.isPaid ? 'PAID' : '');
    
    // Fallback logo in case the primary one fails
    const logoUrl = 'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/22aff172-b276-441f-bcf5-c02c648871ce.png';

    // Return the robust HTML template
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice - ${safeBooking._id || 'N/A'}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 14px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 25px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; position: relative; }
            .workshop-info { text-align: left; }
            .workshop-logo { max-width: 150px; max-height: 80px; }
            .workshop-info h2 { margin: 30px 0 0 0; color: #222; font-weight: 600; }
            .workshop-info p { margin: 5px 0; color: #555; }
            .invoice-info { text-align: right; }
            .invoice-info p { margin: 0; line-height: 1.6em; }
            .details-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .bill-to p { margin: 0; line-height: 1.6em; color: #555; }
            .bill-to strong { color: #333; }
            .invoice-table { width: 100%; text-align: left; border-collapse: collapse; }
            .invoice-table th, .invoice-table td { padding: 12px 15px; }
            .invoice-table thead tr { background: #f9f9f9; border-bottom: 1px solid #ddd; }
            .invoice-table th { font-weight: 600; }
            .invoice-table .item-row td { border-bottom: 1px solid #f0f0f0; }
            .invoice-table .item-description { color: #555; font-size: 13px; }
            .totals { margin-top: 25px; float: right; width: 40%; }
            .totals-table { width: 100%; }
            .totals-table td { padding: 8px; }
            .totals-table .label { text-align: right; font-weight: 600; color: #555; }
            .totals-table .value { text-align: right; }
            .totals-table .grand-total td { font-size: 1.2em; font-weight: bold; color: #000; border-top: 2px solid #eee; padding-top: 10px !important;}
            .footer { text-align: center; margin-top: 100px; font-size: 12px; color: #888; }
            .paid-stamp {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-25deg);
                font-size: 2.5em;
                font-weight: bold;
                color: #4CAF50;
                border: 3px solid #4CAF50;
                padding: 10px 20px;
                border-radius: 5px;
                opacity: 0.7;
                white-space: nowrap;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <header class="header">
                <div class="workshop-info">
                    <img src="${logoUrl}" alt="Workshop Logo" class="workshop-logo"/>
                    <h2>${safeWorkshop.name || 'MotoFix Workshop'}</h2>
                    <p>${safeWorkshop.address || 'Address not available'}</p>
                    <p>${safeWorkshop.phone || 'Phone not available'}</p>
                </div>
                <div class="invoice-info">
                    <h1>INVOICE</h1>
                    <p><b>#:</b> ${safeBooking._id || 'N/A'}</p>
                    <p><b>Issued:</b> ${invoiceDate}</p>
                    <p><b>Service on:</b> ${serviceDate}</p>
                </div>
                ${paymentMethodText ? `<div class="paid-stamp">${paymentMethodText}</div>` : ''}
            </header>
            
            <section class="details-section">
                <div class="bill-to">
                    <strong>Bill To</strong>
                    <p>
                        ${safeCustomer.fullName || 'Customer Name N/A'} <br>
                        ${safeCustomer.email || 'Email N/A'} <br>
                        ${safeCustomer.address || 'No address provided'}
                    </p>
                </div>
            </section>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="item-row">
                        <td>
                            ${safeBooking.serviceType || 'Service Not Specified'}
                            <div class="item-description">Vehicle: ${safeBooking.bikeModel || 'N/A'}</div>
                            ${safeBooking.notes ? `<div class="item-description">Notes: ${safeBooking.notes}</div>` : ''}
                        </td>
                        <td style="text-align: right;">Rs. ${serviceCost.toFixed(2)}</td>
                    </tr>
                    ${safeBooking.requestedPickupDropoff ? `
                    <tr class="item-row">
                        <td>
                            Pick-up & Drop-off Service
                            <div class="item-description">From: ${safeBooking.pickupAddress || 'N/A'}</div>
                            <div class="item-description">To: ${safeBooking.dropoffAddress || 'N/A'}</div>
                            <div class="item-description">Distance: ${safeBooking.pickupDropoffDistance ? `${safeBooking.pickupDropoffDistance.toFixed(2)} km` : 'N/A'}</div>
                        </td>
                        <td style="text-align: right;">Rs. ${pickupDropoffCost.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>

            <div class="totals">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="value">Rs. ${subtotalBeforeDiscount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">Discount (${safeBooking.discountApplied ? '20%' : '0%'})</td>
                        <td class="value">Rs. ${discount.toFixed(2)}</td>
                    </tr>
                    <tr class="grand-total">
                        <td class="label">Grand Total</td>
                        <td class="value">Rs. ${grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <footer class="footer">
                Thank you for your business!
            </footer>
        </div>
    </body>
    </html>`;
};

// This is the crucial part for Node.js
module.exports = getInvoiceHTML; 
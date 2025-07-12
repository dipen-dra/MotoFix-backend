export const getInvoiceHTML = (booking, workshop) => {
    const total = booking.totalCost;
    const discount = booking.discountAmount || 0;
    const grandTotal = booking.finalAmount;

    const invoiceDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const serviceDate = new Date(booking.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    // IMPORTANT: Replace this with the actual public URL to your logo
    const logoUrl = 'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/22aff172-b276-441f-bcf5-c02c648871ce.png'; 

    // --- NEW: Pickup/Drop-off details HTML, integrated more smoothly ---
    let pickupDropoffDetailsHtml = '';
    if (booking.pickupDropoffRequested) {
        pickupDropoffDetailsHtml = `
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #e0e0e0; font-size: 12px; color: #666;">
                <strong>Pickup & Delivery:</strong><br>
                Address: ${booking.pickupDropoffAddress || booking.customer.address}<br>
                Cost: Rs. ${booking.pickupDropoffCost ? booking.pickupDropoffCost.toFixed(2) : '0.00'}
            </div>
        `;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice - ${booking._id}</title>
        <style>
            body { 
                font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; /* Modern sans-serif font stack */
                color: #333; 
                font-size: 13px; 
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9; /* Light background for the page */
            }
            .invoice-box { 
                max-width: 780px; /* Slightly narrower */
                margin: 30px auto; 
                padding: 35px; 
                border: 1px solid #e9e9e9; /* Very subtle border */
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07); /* Deeper, softer shadow */
                background: #fff;
                border-radius: 12px; /* More rounded corners */
                overflow: hidden; /* To contain elements like paid stamp */
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; /* Center items vertically */
                margin-bottom: 35px; 
                padding-bottom: 25px; 
                border-bottom: 1px solid #f2f2f2; /* Lighter, cleaner separator */
                position: relative; 
            }
            .workshop-info { 
                text-align: left; 
            }
            .workshop-logo { 
                max-width: 150px; 
                max-height: 80px; 
                margin-bottom: 8px; 
            }
            .workshop-info h2 { 
                margin: 0; 
                color: #2c3e50; /* Darker, more professional blue-grey */
                font-weight: 700; 
                font-size: 24px; /* Larger workshop name */
            }
            .workshop-info p { 
                margin: 2px 0; 
                color: #777; 
                font-size: 12px;
            }
            .invoice-info { 
                text-align: right; 
                line-height: 1.4;
            }
            .invoice-info h1 {
                font-size: 38px; /* Prominent "INVOICE" */
                color: #3498db; /* A distinct blue */
                margin: 0 0 10px 0;
                letter-spacing: 1px;
            }
            .invoice-info p { 
                margin: 0; 
                font-size: 13px;
                color: #666;
            }
            .invoice-info p b {
                color: #444;
                width: 90px; /* Align labels */
                display: inline-block;
                text-align: left;
            }
            .details-section { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 45px; 
                padding: 15px 0;
            }
            .bill-to, .booking-summary-block { /* Combined styling for info blocks */
                width: 48%; /* Keep them side by side */
                background-color: #fcfcfc; /* Very light background */
                border: 1px solid #f0f0f0; /* Subtle border */
                border-radius: 6px;
                padding: 15px 20px;
                box-sizing: border-box; /* Include padding in width */
            }
            .details-section h3 {
                margin: 0 0 10px 0; 
                font-size: 15px; 
                color: #4a69bd; /* Blue heading */
                font-weight: bold;
                border-bottom: 1px solid #eef4fb; /* Light separator for heading */
                padding-bottom: 5px;
            }
            .details-section p { 
                margin: 0; 
                line-height: 1.5em; 
                color: #666; 
                font-size: 13px;
            }
            .details-section p strong {
                color: #333;
            }

            .invoice-table { 
                width: 100%; 
                text-align: left; 
                border-collapse: collapse; 
                margin-bottom: 40px; 
                border-radius: 8px; /* Rounded table corners */
                overflow: hidden; /* For rounded corners */
                border: 1px solid #e0e0e0; /* Border around table */
            }
            .invoice-table th, .invoice-table td { 
                padding: 14px 20px; 
                vertical-align: top;
            }
            .invoice-table thead tr { 
                background: #4a69bd; /* Strong blue header background */
                color: #ffffff; 
                font-weight: 600;
                font-size: 14px;
            }
            .invoice-table tbody tr:nth-child(even) { 
                background: #f9f9f9; /* Lighter stripe */
            }
            .invoice-table tbody tr:last-child td {
                border-bottom: none; /* No bottom border on last row */
            }
            .invoice-table .item-description { 
                color: #888; 
                font-size: 11px; 
                margin-top: 5px;
            }
            .invoice-table strong {
                color: #333;
            }

            .totals { 
                margin-top: 30px; 
                float: right; 
                width: 55%; /* Wider totals area */
                background-color: #fcfcfc;
                border: 1px solid #e0e0e0; 
                border-radius: 8px; 
                overflow: hidden; 
            }
            .totals-table { 
                width: 100%; 
            }
            .totals-table tr:last-child {
                background: #4a69bd; /* Grand total row highlight */
                color: #ffffff;
            }
            .totals-table td { 
                padding: 12px 20px; 
            }
            .totals-table .label { 
                text-align: right; 
                font-weight: 600; 
                color: #555; 
            }
            .totals-table tr:last-child .label {
                 color: #ffffff; /* White text for grand total label */
            }
            .totals-table .value { 
                text-align: right; 
                font-weight: 600;
                color: #333;
            }
            .totals-table tr:last-child .value {
                font-size: 1.4em; /* Larger grand total value */
                font-weight: bold;
                color: #ffffff; /* White text for grand total value */
            }
            .footer { 
                text-align: center; 
                margin-top: 70px; 
                font-size: 12px; 
                color: #999; 
                border-top: 1px solid #f2f2f2; 
                padding-top: 25px;
                line-height: 1.4;
            }
            /* PAID Stamp styles */
            .paid-stamp {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-25deg);
                font-size: 3.2em; /* Even larger */
                font-weight: bold;
                color: #2ecc71; /* Brighter green */
                border: 5px solid #2ecc71;
                padding: 15px 30px;
                border-radius: 10px;
                opacity: 0.85; 
                white-space: nowrap;
                z-index: 1000; 
                background: rgba(255, 255, 255, 0.8); 
                box-shadow: 0 0 20px rgba(0,0,0,0.15);
            }
            .clear-float {
                clear: both; /* Used to clear floats for proper layout */
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <header class="header">
                <div class="workshop-info">
                    <img src="${logoUrl}" alt="Workshop Logo" class="workshop-logo"/>
                    <h2>${workshop.workshopName}</h2> 
                    <p>${workshop.address}</p>
                    <p>${workshop.phone}</p>
                </div>
                <div class="invoice-info">
                    <h1>INVOICE</h1>
                    <p><b>#:</b> ${booking._id}</p>
                    <p><b>Issued:</b> ${invoiceDate}</p>
                    <p><b>Service on:</b> ${serviceDate}</p>
                </div>
                ${booking.isPaid ? `<div class="paid-stamp">PAID via ${booking.paymentMethod.toUpperCase()}</div>` : ''}
            </header>
            
            <section class="details-section">
                <div class="bill-to">
                    <h3>Bill To:</h3>
                    <p>
                        <strong>${booking.customer.fullName}</strong> <br>
                        ${booking.customer.email} <br>
                        ${booking.customer.phone || 'No phone provided'} <br> 
                        ${booking.customer.address || 'No address provided'}
                    </p>
                </div>
                
                <div class="booking-summary-block">
                    <h3>Booking Details:</h3>
                    <p>
                        <strong>Service:</strong> ${booking.serviceType} <br>
                        <strong>Vehicle:</strong> ${booking.bikeModel} <br>
                        <strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} <br>
                        <strong>Status:</strong> ${booking.status} <br>
                        <strong>Payment:</strong> ${booking.paymentStatus || 'Pending'} (${booking.paymentMethod || 'N/A'})
                    </p>
                    ${pickupDropoffDetailsHtml} 
                </div>
            </section>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Service Description</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="item-row">
                        <td>
                            <strong>${booking.serviceType}</strong>
                            <div class="item-description">Vehicle: ${booking.bikeModel}</div>
                            <div class="item-description">Notes: ${booking.notes || 'N/A'}</div>
                        </td>
                        <td style="text-align: right;">Rs. ${total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="value">Rs. ${total.toFixed(2)}</td>
                    </tr>
                    ${booking.pickupDropoffRequested ? `
                    <tr>
                        <td class="label">Pickup & Delivery</td>
                        <td class="value">Rs. ${booking.pickupDropoffCost ? booking.pickupDropoffCost.toFixed(2) : '0.00'}</td>
                    </tr>
                    ` : ''}
                    ${booking.discountApplied ? `
                    <tr>
                        <td class="label">Discount</td>
                        <td class="value">Rs. -${discount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="grand-total">
                        <td class="label">Grand Total</td>
                        <td class="value">Rs. ${grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div class="clear-float"></div> <footer class="footer">
                Thank you for your business! If you have any questions, please contact us.<br>
                Visit us at <strong>${workshop.workshopName}</strong> - ${workshop.address || 'No address provided'}
            </footer>
        </div>
    </body>
    </html>`;
};
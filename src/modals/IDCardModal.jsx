import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { X, Printer } from 'lucide-react';

/**
 * HOW TO ADD LOGO:
 * 1. Place your logo image file in: public/logos/drk-logo.png
 * 2. Update the src in the header image below from "/download.png" to "/logos/drk-logo.png"
 * Example: <img src="/logos/drk-logo.png" alt="Logo" className="h-12 w-12 object-contain" />
 * 
 * Logo requirements:
 * - Format: PNG, JPG, SVG
 * - Size: 48x48px or square format
 * - Place in public/logos/ folder
 */

export function IDCardModal({ idCardData, onClose }) {
  const cardRef = useRef();

  if (!idCardData) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; font-family: Arial, sans-serif; }
            .card { width: 400px; background: white; border: 1px solid #ccc; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .header { display: flex; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0; align-items: center; margin-bottom: 16px; }
            .logo { flex-shrink: 0; height: 48px; width: 48px; object-fit: contain; }
            .college-info h2 { margin: 0; font-size: 14px; font-weight: bold; color: #333; }
            .college-info p { margin: 4px 0 0 0; font-size: 11px; color: #666; }
            .content { display: flex; gap: 12px; }
            .left { flex: 1; }
            .photo { height: 100px; width: 80px; border: 1px solid #999; border-radius: 6px; object-fit: cover; display: block; margin-bottom: 12px; flex-shrink: 0; }
            .details { font-size: 12px; }
            .detail-row { margin-bottom: 8px; }
            .detail-label { font-size: 10px; font-weight: bold; color: #666; }
            .detail-value { font-size: 11px; color: #333; font-weight: 500; word-break: break-word; }
            .right { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
            .qr-box { background: white; padding: 4px; border: 1px solid #999; border-radius: 4px; }
            .qr-label { font-size: 10px; color: #666; margin-top: 4px; text-align: center; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
            @media print { body { background: white; } .card { box-shadow: none; } }
          </style>
        </head>
        <body>
          <div id="card"></div>
        </body>
      </html>
    `);
    setTimeout(() => {
      printWindow.document.getElementById('card').innerHTML = cardRef.current.outerHTML;
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[170] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-4 border-b flex items-center gap-3">
          <h3 className="text-lg font-bold">Student ID Card</h3>
          <button onClick={onClose} className="ml-auto text-slate-500"><X /></button>
        </div>

        <div className="p-8 flex justify-center">
          <div ref={cardRef} className="w-96 bg-white rounded-xl shadow-lg border border-slate-300" style={{ height: 'auto', padding: '16px' }}>
            {/* Header: Logo + College Name */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="flex-shrink-0">
                <img src="/logos/drk-logo.png" alt="Logo" className="h-12 w-12 object-contain" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800">DRK Institute Of Science & Technology</div>
                <div className="text-xs text-slate-600">(Approved by AICTE & Affiliated to JNTUH)</div>
              </div>
            </div>

            {/* Main Content: Photo + Details on Left, QR on Right */}
            <div className="flex gap-3 mt-4">
              {/* Left Section: Photo + Details */}
              <div className="flex-1">
                {/* Photo - Fixed Size */}
                {idCardData.photo && (
                  <div className="mb-3 overflow-hidden rounded border border-slate-300" style={{ height: '100px', width: '80px' }}>
                    <img src={idCardData.photo} alt="Photo" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Student Details */}
                <div className="space-y-1 text-xs">
                  <div>
                    <div className="font-semibold text-slate-600">Name</div>
                    <div className="font-bold text-slate-800 text-sm">{idCardData.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-600">Roll No</div>
                    <div className="font-bold text-slate-800">{idCardData.studentId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-600">Email</div>
                    <div className="text-slate-800 truncate">{idCardData.email || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <div className="font-semibold text-slate-600">Branch</div>
                      <div className="text-slate-800">{idCardData.branch || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-600">Year</div>
                      <div className="text-slate-800">{idCardData.year || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-600">Phone</div>
                    <div className="text-slate-800">{idCardData.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Right Section: QR Code (Small, Bottom Right) */}
              <div className="flex flex-col items-center justify-end">
                <div className="bg-white p-1 rounded border border-slate-300">
                  <QRCode value={idCardData.studentId || 'ID'} size={50} level="H" includeMargin={false} />
                </div>
                <div className="text-xs text-slate-600 mt-1">QR ID</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-slate-50">Close</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

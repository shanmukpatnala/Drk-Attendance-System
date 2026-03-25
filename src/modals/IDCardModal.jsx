import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { X } from 'lucide-react';

export function IDCardModal({ idCardData, onClose }) {
  const cardRef = useRef(null);

  if (!idCardData) return null;

  const handlePrint = () => {
    const cardMarkup = cardRef.current?.innerHTML;
    if (!cardMarkup) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card - ${idCardData.studentId || 'Student'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; }
            .print-card { width: 384px; margin: 0 auto; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <div class="print-card">${cardMarkup}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="flex-shrink-0">
                <img src="/logos/login-logo.png" alt="Logo" className="h-14 w-21 object-contain" />
              </div>
            </div>

            <div className="mt-4">
              {idCardData.photo && (
                <div className="mb-4 flex justify-center">
                  <div className="overflow-hidden rounded border border-slate-300" style={{ height: '170px', width: '150px' }}>
                    <img src={idCardData.photo} alt="Photo" className="w-full h-full object-cover object-center" />
                  </div>
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="w-full space-y-1 text-xs">
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

                <div className="flex flex-col items-center justify-end">
                  <div className="bg-white p-1 rounded border border-slate-300">
                    <QRCode value={idCardData.studentId || 'ID'} size={50} level="H" includeMargin={false} />
                  </div>
                  <div className="text-xs text-slate-600 mt-1">QR ID</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Print ID Card</button>
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

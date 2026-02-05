import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { X, Printer } from 'lucide-react';

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
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
            .card { width: 400px; height: 250px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); color: white; display: flex; gap: 20px; }
            .left { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
            .right { display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .photo { width: 100px; height: 120px; border-radius: 8px; object-fit: cover; border: 2px solid white; }
            .qr { background: white; padding: 4px; border-radius: 4px; }
            .name { font-size: 18px; font-weight: bold; }
            .label { font-size: 10px; opacity: 0.8; }
            .value { font-size: 12px; font-weight: 500; }
            @media print { body { background: white; } }
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
          <div ref={cardRef} className="w-96 h-56 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-5 shadow-lg text-white flex gap-4">
            <div className="flex-1 flex flex-col justify-center gap-2">
              <div className="text-xl font-bold">{idCardData.name || 'N/A'}</div>
              <div>
                <div className="text-xs opacity-75">ID</div>
                <div className="text-sm font-bold">{idCardData.studentId || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs opacity-75">Branch</div>
                <div className="text-sm">{idCardData.branch || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs opacity-75">Year</div>
                <div className="text-sm">{idCardData.year || 'N/A'}</div>
              </div>
              <div className="text-xs opacity-75">Phone: {idCardData.phone || 'N/A'}</div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              {idCardData.photo && (
                <img src={idCardData.photo} alt="Photo" className="w-24 h-28 rounded border-2 border-white object-cover" />
              )}
              <div className="bg-white p-2 rounded">
                <QRCode value={idCardData.studentId || 'ID'} size={60} level="H" includeMargin={false} />
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

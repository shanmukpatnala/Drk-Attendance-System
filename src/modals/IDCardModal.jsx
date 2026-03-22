import React from 'react';
import QRCode from 'qrcode.react';
import { X } from 'lucide-react';

/**
 * HOW TO ADJUST THE LOGO:
 * 1. Place your logo image file in: public/logos/login-logo.png
 * 2. Update the src in the header image below (currently set to "/logos/login-logo.png").
 * Example: <img src="/logos/login-logo.png" alt="Logo" className="h-14 w-14 object-contain" />
 *
 * Logo requirements:
 * - Format: PNG, JPG, SVG
 * - Size: 48x48px or square format (recommended)
 * - Place in public/logos/ folder
 */

export function IDCardModal({ idCardData, onClose }) {
  if (!idCardData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[170] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-4 border-b flex items-center gap-3">
          <h3 className="text-lg font-bold">Student ID Card</h3>
          <button onClick={onClose} className="ml-auto text-slate-500"><X /></button>
        </div>

        <div className="p-8 flex justify-center">
          <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-300" style={{ height: 'auto', padding: '16px' }}>
            {/* Header: Logo */}
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
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

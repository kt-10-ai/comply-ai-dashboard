import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';

const NBFCTable = ({ nbfcs }) => {
  const navigate = useNavigate();

  if (!nbfcs || nbfcs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <FileText className="mx-auto text-subtext mb-3" size={32} />
        <p className="text-sm text-subtext">No NBFC records found.</p>
      </div>
    );
  }

  const getLayerBadgeColor = (layer) => {
    switch (layer) {
      case 'Base':
        return 'bg-success/10 border-success/20 text-success';
      case 'Middle':
        return 'bg-cyan/10 border-cyan/20 text-cyan';
      case 'Upper':
        return 'bg-amber/10 border-amber/20 text-amber';
      case 'Top':
        return 'bg-danger/10 border-danger/20 text-danger';
      default:
        return 'bg-muted/10 border-muted/20 text-subtext';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-card/50 text-[11px] font-semibold uppercase tracking-wider text-subtext">
              <th className="px-6 py-4">S.No.</th>
              <th className="px-6 py-4">NBFC Name</th>
              <th className="px-6 py-4">Classification</th>
              <th className="px-6 py-4">Layer</th>
              <th className="px-6 py-4">Deposits</th>
              <th className="px-6 py-4">Regional Office</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {nbfcs.map((nbfc) => (
              <tr 
                key={nbfc.cin} 
                className="hover:bg-card/40 transition-colors group cursor-pointer"
                onClick={() => navigate(`/nbfc/${nbfc.cin}`)}
              >
                <td className="px-6 py-4 text-xs font-mono text-subtext">#{nbfc.sl_no}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-text group-hover:text-cyan transition-colors">
                    {nbfc.nbfc_name}
                  </div>
                  <div className="text-xs font-mono text-subtext">{nbfc.cin}</div>
                </td>
                <td className="px-6 py-4 text-sm text-text">
                  <span className="bg-card px-2.5 py-1 rounded border border-border text-xs font-semibold">
                    {nbfc.classification}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getLayerBadgeColor(nbfc.layer)}`}>
                    {nbfc.layer}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className={nbfc.accepts_deposits === 'Yes' ? 'text-success font-semibold' : 'text-subtext'}>
                    {nbfc.accepts_deposits === 'Yes' ? 'Accepts' : 'Non-Deposit'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-subtext">{nbfc.regional_office}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 rounded-lg border border-border bg-card text-subtext group-hover:text-cyan group-hover:border-cyan/30 transition-all">
                    <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NBFCTable;

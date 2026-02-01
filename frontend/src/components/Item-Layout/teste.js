import React, { useState, useMemo } from 'react';
import { Smartphone, Search, Package, AlertCircle, TrendingUp } from 'lucide-react';

// 1. Dados Gerados (Simulação de Vendas de Smartphones)
const APPAREL_DATA = [
  { id: 1, modelo: 'iPhone 15 Pro Max', marca: 'Apple', vendido: 45, estoque: 12, preco: 8999, custo: 6200, status: 'Estoque Baixo' },
  { id: 2, modelo: 'Galaxy S24 Ultra', marca: 'Samsung', vendido: 38, estoque: 25, preco: 7499, custo: 5100, status: 'Saudável' },
  { id: 3, modelo: 'Motorola Edge 50', marca: 'Motorola', vendido: 22, estoque: 40, preco: 3299, custo: 2100, status: 'Saudável' },
  { id: 4, modelo: 'Redmi Note 13 Pro', marca: 'Xiaomi', vendido: 65, estoque: 5, preco: 2199, custo: 1400, status: 'Crítico' },
  { id: 5, modelo: 'iPhone 13 128GB', marca: 'Apple', vendido: 89, estoque: 50, preco: 3899, custo: 2800, status: 'Saudável' },
  { id: 6, modelo: 'Galaxy A55 5G', marca: 'Samsung', vendido: 112, estoque: 15, preco: 1899, custo: 1100, status: 'Giro Rápido' },
  { id: 7, modelo: 'Z Flip 5', marca: 'Samsung', vendido: 12, estoque: 8, preco: 4599, custo: 3200, status: 'Estoque Baixo' },
];

const RelatorioAparelhos = () => {
  const [filtroMarca, setFiltroMarca] = useState('Todas');
  const [busca, setBusca] = useState('');

  // 2. Filtros e Cálculos
  const dadosFiltrados = useMemo(() => {
    return APPAREL_DATA.filter(item => {
      const matchBusca = item.modelo.toLowerCase().includes(busca.toLowerCase());
      const matchMarca = filtroMarca === 'Todas' || item.marca === filtroMarca;
      return matchBusca && matchMarca;
    });
  }, [busca, filtroMarca]);

  const faturamentoTotal = dadosFiltrados.reduce((acc, curr) => acc + (curr.vendido * curr.preco), 0);
  const lucroTotal = dadosFiltrados.reduce((acc, curr) => acc + (curr.vendido * (curr.preco - curr.custo)), 0);

  return (
    <div className="p-6 bg-white min-h-screen text-slate-800 font-sans">
      {/* Header Corporativo */}
      <div className="border-b pb-4 mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="text-red-600" /> 
            Performance de Hardware - SPI
          </h2>
          <p className="text-sm text-slate-500">Consolidado de vendas e inventário</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          Gerado em: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 p-4 border rounded shadow-sm">
          <p className="text-xs uppercase text-slate-500 font-bold mb-1">Faturamento Bruto</p>
          <p className="text-xl font-black">R$ {faturamentoTotal.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 p-4 border rounded shadow-sm font-medium">
          <p className="text-xs uppercase text-slate-500 font-bold mb-1">Lucro Estimado</p>
          <p className="text-xl font-black text-teal-600">R$ {lucroTotal.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 p-4 border rounded shadow-sm font-medium">
          <p className="text-xs uppercase text-slate-500 font-bold mb-1">Unidades Vendidas</p>
          <p className="text-xl font-black">{dadosFiltrados.reduce((a, b) => a + b.vendido, 0)}</p>
        </div>
        <div className="bg-slate-50 p-4 border rounded shadow-sm font-medium">
          <p className="text-xs uppercase text-slate-500 font-bold mb-1">Margem Média</p>
          <p className="text-xl font-black text-blue-600">
            {Math.round((lucroTotal / faturamentoTotal) * 100)}%
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-4 items-center bg-slate-100 p-3 rounded">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar modelo..." 
            className="w-full pl-10 pr-4 py-2 text-sm border rounded outline-none focus:ring-1 focus:ring-red-500"
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select 
          className="p-2 text-sm border rounded outline-none bg-white min-w-[150px]"
          onChange={(e) => setFiltroMarca(e.target.value)}
        >
          <option value="Todas">Todas as Marcas</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="Motorola">Motorola</option>
          <option value="Xiaomi">Xiaomi</option>
        </select>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-hidden border rounded-lg shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2d2d2d] text-white">
            <tr>
              <th className="p-3 font-semibold border-r border-slate-600">MODELO</th>
              <th className="p-3 font-semibold">MARCA</th>
              <th className="p-3 font-semibold text-center">VENDAS</th>
              <th className="p-3 font-semibold text-center">ESTOQUE</th>
              <th className="p-3 font-semibold text-right">PREÇO UNIT.</th>
              <th className="p-3 font-semibold text-right">MARKUP</th>
              <th className="p-3 font-semibold text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dadosFiltrados.map((item) => {
              const markup = ((item.preco - item.custo) / item.custo * 100).toFixed(0);
              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold border-r">{item.modelo}</td>
                  <td className="p-3 text-slate-600">{item.marca}</td>
                  <td className="p-3 text-center font-semibold text-blue-700 bg-blue-50/30">{item.vendido}</td>
                  <td className={`p-3 text-center font-bold ${item.estoque < 15 ? 'text-red-600 bg-red-50/50' : ''}`}>
                    {item.estoque} un
                  </td>
                  <td className="p-3 text-right">R$ {item.preco.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium text-teal-600">{markup}%</td>
                  <td className="p-3">
                    <div className={`
                      flex items-center gap-1 justify-center py-1 rounded-sm text-[10px] font-black uppercase
                      ${item.status === 'Crítico' ? 'bg-red-600 text-white' : 
                        item.status === 'Estoque Baixo' ? 'bg-orange-500 text-white' : 
                        item.status === 'Giro Rápido' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}
                    `}>
                      {item.status === 'Crítico' && <AlertCircle size={10} />}
                      {item.status === 'Giro Rápido' && <TrendingUp size={10} />}
                      {item.status}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioAparelhos;
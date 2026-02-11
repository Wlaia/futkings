import React, { useState, useEffect } from 'react';
import { FaHardHat, FaShoppingBag, FaClock, FaExclamationTriangle } from 'react-icons/fa';

interface Product {
    id: number;
    name: string;
    price: string;
    image: string;
    comingSoon: boolean;
}

const Store: React.FC = () => {
    const defaultProducts: Product[] = [
        {
            id: 1,
            name: "Boné Oficial FutKings",
            price: "R$ 89,90",
            image: "/products/cap.png",
            comingSoon: true
        },
        {
            id: 2,
            name: "Camisa Oficial Pro",
            price: "R$ 149,90",
            image: "/products/jersey.png",
            comingSoon: true
        },
        {
            id: 3,
            name: "Garrafa Térmica",
            price: "R$ 59,90",
            image: "/products/bottle.png",
            comingSoon: true
        },
        {
            id: 4,
            name: "Kit Treino Completo",
            price: "R$ 299,90",
            image: "/products/kit.png",
            comingSoon: true
        }
    ];

    const [products, setProducts] = useState<Product[]>(defaultProducts);

    return (
        <div className="min-h-screen pb-24 px-4 md:px-8 pt-8">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-yellow-900/40 to-black rounded-3xl p-8 mb-8 border border-yellow-500/30 relative overflow-hidden text-center md:text-left transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                {/* Background Texture */}
                <div className="absolute inset-0 bg-gray-900 opacity-50 mix-blend-overlay"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-500/20">
                            <FaHardHat /> Em Construção
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-2 uppercase italic tracking-tighter">
                            Loja Oficial <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">FutKings</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                            A revolução do seu estilo dentro e fora de campo. <br />
                            <span className="text-yellow-500 font-bold">Em breve</span> você poderá adquirir produtos exclusivos da nossa marca.
                        </p>
                    </div>

                    {/* Animated Construction Icon */}
                    <div className="bg-yellow-500/10 p-6 rounded-full border border-yellow-500/30 animate-pulse relative">
                        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse-slow"></div>
                        <FaShoppingBag className="text-yellow-500 text-6xl relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                    </div>
                </div>
            </div>

            {/* Construction Warning Banner */}
            <div className="bg-gray-800/50 border-l-4 border-yellow-500 p-6 mb-12 rounded-r-2xl flex flex-col md:flex-row items-center gap-4 backdrop-blur-sm">
                <div className="bg-yellow-500/10 p-3 rounded-full">
                    <FaExclamationTriangle className="text-yellow-500 text-2xl flex-shrink-0" />
                </div>
                <div className="text-center md:text-left">
                    <h3 className="font-bold text-white text-lg mb-1">Estamos finalizando os detalhes!</h3>
                    <p className="text-gray-400 text-sm">
                        Nossa equipe está trabalhando nos últimos ajustes da loja virtual. Abaixo você confere uma prévia exclusiva do que vem por aí.
                    </p>
                </div>
            </div>

            {/* Product Showcase Title */}
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                    <span className="text-yellow-500">🔥</span> Destaques da Coleção
                </h2>
                <div className="h-px bg-gray-800 flex-1"></div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {products.map((product) => (
                    <div key={product.id} className="group bg-gray-800/40 rounded-3xl p-4 border border-gray-700/50 hover:border-yellow-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden flex flex-col h-full">

                        {/* Image Container */}
                        <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center p-6 group-hover:bg-gray-800 transition-colors">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 relative z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('bg-gray-800');
                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-500 text-xs">Imagem não disponível</span>';
                                }}
                            />

                            {/* Overlay Badge */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-10 group-hover:translate-y-0 transition-transform duration-300 z-20">
                                <span className="bg-black/80 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-white/20 backdrop-blur-md whitespace-nowrap">
                                    Em Breve
                                </span>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="text-center mt-auto">
                            <h3 className="font-bold text-white text-lg mb-1 leading-tight group-hover:text-yellow-400 transition-colors">{product.name}</h3>
                            <p className="text-gray-500 font-bold text-xl mb-4">{product.price}</p>

                            <button disabled className="w-full bg-gray-900/50 text-gray-500 py-3 rounded-xl font-bold uppercase tracking-wide cursor-not-allowed flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:bg-gray-800 transition-all">
                                <FaClock className="animate-spin-slow" /> Aguarde Lançamento
                            </button>
                        </div>

                        {/* Top Right Badge */}
                        <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest z-20">
                            Em Breve
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Store;

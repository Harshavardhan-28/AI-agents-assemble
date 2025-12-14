'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';

export default function LiveHomePage() {
  const { user } = useAuth();
  const { data } = useFirebaseRealtime(user?.uid || null);

  const inventoryCount = data?.inventory?.length || 0;
  const recipesCount = data?.recipes?.recipes?.length || 0;
  const shoppingCount = data?.shopping_list?.length || 0;

  const cards = [
    {
      href: '/live/inventory',
      icon: '🧊',
      title: 'Scan Fridge',
      desc: 'Upload a photo to detect ingredients',
      stat: inventoryCount > 0 ? `${inventoryCount} items` : null,
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      href: '/live/recipes',
      icon: '👨‍🍳',
      title: 'Get Recipes',
      desc: 'AI generates meals from your inventory',
      stat: recipesCount > 0 ? `${recipesCount} recipes` : null,
      color: 'from-orange-500/20 to-amber-500/20',
    },
    {
      href: '/live/shopping',
      icon: '🛒',
      title: 'Shopping List',
      desc: 'See what you need to buy',
      stat: shoppingCount > 0 ? `${shoppingCount} items` : null,
      color: 'from-green-500/20 to-emerald-500/20',
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#d4a574] mb-2">
          Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-[#8b7355] text-sm">What would you like to do today?</p>
      </div>

      {/* Action Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              href={card.href}
              className={`block p-6 rounded-2xl border border-[#d4a574]/20 bg-gradient-to-br ${card.color} hover:border-[#d4a574]/40 transition-all group`}
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">
                {card.icon}
              </span>
              <h2 className="font-semibold text-[#f5e6d3] mb-1">{card.title}</h2>
              <p className="text-xs text-[#8b7355]">{card.desc}</p>
              {card.stat && (
                <span className="inline-block mt-3 text-xs bg-[#d4a574]/20 text-[#d4a574] px-2 py-0.5 rounded-full">
                  {card.stat}
                </span>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Status */}
      {(inventoryCount > 0 || recipesCount > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 bg-[#2a2520] rounded-xl border border-[#d4a574]/10"
        >
          <h3 className="text-sm font-medium text-[#d4a574] mb-3">Quick Overview</h3>
          <div className="flex flex-wrap gap-2">
            {data?.inventory?.slice(0, 6).map((item, i) => (
              <span key={i} className="text-xs bg-[#1a1916] px-2 py-1 rounded-full text-[#8b7355]">
                {item.name}
              </span>
            ))}
            {inventoryCount > 6 && (
              <span className="text-xs text-[#8b7355]">+{inventoryCount - 6} more</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

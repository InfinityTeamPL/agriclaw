'use client';

// Client form dla onboardingu.
// 1) Geokodowanie adresu (POST /api/geocode)
// 2) Tworzenie farmy (POST /api/farms z {name, address, lat, lon})
// 3) router.push('/dashboard') po sukcesie

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

export function OnboardingForm({ defaultName = '' }: { defaultName?: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName || trimmedAddress.length < 3) {
      toast.error('Uzupełnij nazwę i adres (min. 3 znaki).');
      return;
    }

    setLoading(true);
    try {
      // 1) Geocode
      const geoRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmedAddress }),
      });
      if (!geoRes.ok) {
        const data = await geoRes.json().catch(() => null);
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Nie znaleziono adresu. Spróbuj bardziej szczegółowo.',
        );
        setLoading(false);
        return;
      }
      const geo = (await geoRes.json()) as {
        lat: number;
        lon: number;
        displayName?: string;
      };

      // 2) Create farm
      const farmRes = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          address: geo.displayName ?? trimmedAddress,
          lat: geo.lat,
          lon: geo.lon,
        }),
      });
      if (!farmRes.ok) {
        const data = await farmRes.json().catch(() => null);
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Nie udało się utworzyć gospodarstwa.',
        );
        setLoading(false);
        return;
      }

      toast.success('Gospodarstwo utworzone.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Nieoczekiwany błąd. Spróbuj ponownie.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="farm-name" className="block text-sm font-medium mb-1 text-gray-800">
          Nazwa gospodarstwa
        </label>
        <input
          id="farm-name"
          type="text"
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Gospodarstwo Kowalski"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="farm-address" className="block text-sm font-medium mb-1 text-gray-800">
          Adres gospodarstwa
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="farm-address"
            type="text"
            required
            minLength={3}
            maxLength={500}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="np. Zamość, Lubelskie"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Podaj miejscowość + województwo lub dokładny adres — znajdziemy współrzędne.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Zapisuję gospodarstwo...' : 'Dodaj gospodarstwo'}
      </button>
    </form>
  );
}

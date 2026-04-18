'use client';

// Formularz profilu. PATCH /api/user.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface Props {
  defaultValues: {
    email: string;
    name: string;
    phoneNumber: string;
  };
}

export function SettingsForm({ defaultValues }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues.name);
  const [phoneNumber, setPhoneNumber] = useState(defaultValues.phoneNumber);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          typeof data?.error === 'string'
            ? data.error
            : 'Nie udało się zapisać zmian.';
        toast.error(msg);
        setSaving(false);
        return;
      }
      toast.success('Zmiany zapisane.');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Nieoczekiwany błąd.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-gray-200 rounded-xl p-4 space-y-4"
    >
      <div>
        <label htmlFor="settings-email" className="block text-sm font-medium mb-1 text-gray-800">
          Email
        </label>
        <input
          id="settings-email"
          type="email"
          value={defaultValues.email}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Email nie może zostać zmieniony. Skontaktuj się z pomocą, aby go zmienić.
        </p>
      </div>

      <div>
        <label htmlFor="settings-name" className="block text-sm font-medium mb-1 text-gray-800">
          Imię i nazwisko
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="np. Jan Kowalski"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="settings-phone" className="block text-sm font-medium mb-1 text-gray-800">
          Telefon (WhatsApp)
        </label>
        <input
          id="settings-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          maxLength={32}
          placeholder="np. +48 600 123 456"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Użyjemy tego numeru do wysyłania rekomendacji na WhatsApp.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Zapisuję...' : 'Zapisz zmiany'}
        </button>
      </div>
    </form>
  );
}

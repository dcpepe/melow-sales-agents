"use client";

export interface Contact {
  name: string;
  email: string;
  role: string;
  company: string;
  side: "melow" | "prospect";
}

interface ContactsInputProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

const EMPTY_CONTACT: Contact = { name: "", email: "", role: "", company: "", side: "prospect" };

export default function ContactsInput({ contacts, onChange }: ContactsInputProps) {
  function addContact() {
    onChange([...contacts, { ...EMPTY_CONTACT }]);
  }

  function removeContact(index: number) {
    onChange(contacts.filter((_, i) => i !== index));
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    const updated = contacts.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    onChange(updated);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Call Participants</h4>
        <button
          type="button"
          onClick={addContact}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-2.5 py-1 hover:bg-gray-50 transition-colors"
        >
          + Add Person
        </button>
      </div>

      {contacts.length === 0 && (
        <p className="text-xs text-gray-400 mb-2">Add participants for richer analysis context</p>
      )}

      <div className="space-y-3">
        {contacts.map((contact, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 border relative">
            <button
              type="button"
              onClick={() => removeContact(i)}
              className="absolute top-2 right-2 text-gray-300 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={contact.name}
                onChange={(e) => updateContact(i, "name", e.target.value)}
                className="border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="email"
                placeholder="Email"
                value={contact.email}
                onChange={(e) => updateContact(i, "email", e.target.value)}
                className="border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="text"
                placeholder="Role / Title"
                value={contact.role}
                onChange={(e) => updateContact(i, "role", e.target.value)}
                className="border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="text"
                placeholder="Company"
                value={contact.company}
                onChange={(e) => updateContact(i, "company", e.target.value)}
                className="border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateContact(i, "side", "melow")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  contact.side === "melow"
                    ? "bg-gray-900 text-white"
                    : "bg-white border text-gray-500 hover:text-gray-700"
                }`}
              >
                Melow
              </button>
              <button
                type="button"
                onClick={() => updateContact(i, "side", "prospect")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  contact.side === "prospect"
                    ? "bg-blue-600 text-white"
                    : "bg-white border text-gray-500 hover:text-gray-700"
                }`}
              >
                Prospect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function contactsToContext(contacts: Contact[]): string {
  if (contacts.length === 0) return "";
  const lines = contacts.map((c) => {
    const parts = [c.name];
    if (c.role) parts.push(`(${c.role})`);
    if (c.company) parts.push(`at ${c.company}`);
    if (c.email) parts.push(`- ${c.email}`);
    parts.push(`[${c.side === "melow" ? "Melow team" : "Prospect"}]`);
    return parts.join(" ");
  });
  return `\n\nCALL PARTICIPANTS:\n${lines.join("\n")}`;
}

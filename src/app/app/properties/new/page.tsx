"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../../components/Card";
import { useProperties } from "../../../../contexts/PropertyContext";

export default function NewPropertyPage() {
  const router = useRouter();
  const { searchProperty } = useProperties();
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (searchAddress: string) => {
    if (!searchAddress.trim()) {
      setError("Please enter an address");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      // Navigate to search page which handles the API call
      router.push(`/app/properties/search?address=${encodeURIComponent(searchAddress.trim())}`);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search property. Please try again.");
      setIsSearching(false);
    }
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSearch(address);
  };

  const handleExampleClick = async (exampleAddress: string) => {
    setAddress(exampleAddress);
    await doSearch(exampleAddress);
  };

  const exampleAddresses = [
    "123 Main Street, Seattle, WA",
    "456 Oak Avenue, Portland, OR",
    "789 Pine Road, San Francisco, CA",
  ];

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white">
          Add Property
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Enter a US address to analyze zoning, utilities, and environmental data.
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <form onSubmit={handleSearch}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Property Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError("");
              }}
              placeholder="Enter address, APN, or coordinates..."
              className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm text-rose-500">{error}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="flex-1 px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search Property</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Search Tips */}
      <Card className="mb-8">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Search Tips</h3>
        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>Include full street address with city and state</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>Use APN (Assessor Parcel Number) for exact matches</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>Coordinates work too: "47.6062, -122.3321"</span>
          </li>
        </ul>
      </Card>

      {/* Example Searches */}
      <Card>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Try an Example</h3>
        <div className="space-y-2">
          {exampleAddresses.map((exampleAddress, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(exampleAddress)}
              disabled={isSearching}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                {exampleAddress}
              </span>
              <svg className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

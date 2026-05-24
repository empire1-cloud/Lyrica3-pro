import React from 'react';
import { Flame } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#05060D] flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <Flame className="w-12 h-12 text-[#FF2EBE] mx-auto" />
            <h1 className="text-2xl font-black text-[#F5F7FA]">Empire Signal Lost</h1>
            <p className="text-[#9CA3B0] text-sm">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-6 py-3 bg-[#FF2EBE] text-black font-bold rounded-xl"
            >
              Reconnect
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
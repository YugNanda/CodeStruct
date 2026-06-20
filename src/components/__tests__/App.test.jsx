import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App'; // Adjust the import path as necessary

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    
    // Look for a specific heading, button, or link that should be on the screen
    // Example: expect(screen.getByText(/DSA Visualizer/i)).toBeInTheDocument();
    
    // Just verifying it rendered some DOM successfully:
    expect(document.body).not.toBeEmptyDOMElement();
  });
});
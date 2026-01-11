
import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";

// Inherit from Product (flattened structure)
export interface CartItem extends Product {
    cantidad: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (product: Product) => {
        setItems((current) => {
            // Using 'id' which maps to product_id in our flattened structure, 
            // but we should verify if we want to track by variant_id if we support variants later.
            // For now, ID is unique enough (mapped from Product ID).
            const existing = current.find((i) => i.id === product.id);
            if (existing) {
                return current.map((i) =>
                    i.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
                );
            }
            return [...current, { ...product, cantidad: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems((current) => current.filter((i) => i.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setItems((current) =>
            current.map((i) =>
                i.id === productId ? { ...i, cantidad: quantity } : i
            )
        );
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};

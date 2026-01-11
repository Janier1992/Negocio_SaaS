
import { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function PageContainer({ children, title, description, actions }: PageContainerProps) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {actions}
                </div>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

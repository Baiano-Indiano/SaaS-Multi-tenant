// Better-Auth type augmentation


declare module "better-auth" {
    interface Session {
        organization?: {
            id: string;
            name: string;
            slug: string;
            logo?: string | null;
            metadata?: string | null;
            createdAt: Date;
        } | null;
    }

    interface User {
        twoFactorEnabled: boolean;
    }
}

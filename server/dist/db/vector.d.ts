export declare const vector: {
    (): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: number[];
        driverParam: string;
        enumValues: undefined;
    }>;
    <TConfig extends Record<string, any> & {
        dim: number;
    }>(fieldConfig?: TConfig | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: number[];
        driverParam: string;
        enumValues: undefined;
    }>;
    <TName extends string>(dbName: TName, fieldConfig?: {
        dim: number;
    } | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: TName;
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: number[];
        driverParam: string;
        enumValues: undefined;
    }>;
};

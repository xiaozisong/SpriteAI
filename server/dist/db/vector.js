"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vector = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.vector = (0, pg_core_1.customType)({
    dataType(config) {
        return config ? `vector(${config.dim})` : 'vector';
    },
    toDriver(value) {
        return `[${value.join(',')}]`;
    },
    fromDriver(value) {
        if (!value)
            return [];
        const cleaned = value.replace(/[[\]\s]/g, '');
        return cleaned.split(',').filter(Boolean).map(Number);
    },
});
//# sourceMappingURL=vector.js.map
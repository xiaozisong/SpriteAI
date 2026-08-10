"""pgvector 类型支持：SQLAlchemy 自定义类型映射 Postgres 的 vector 类型。

pgvector 提供 `vector(n)` 类型存浮点数组。SQLAlchemy 不认识它，需要自定义
`UserDefinedType` 来映射。这里实现一个通用的 Vector 类型。

用法：embedding: Mapped[list[float]] = mapped_column(Vector(1536))
"""
from sqlalchemy.sql.type_api import UserDefinedType


class Vector(UserDefinedType):
    """映射 pgvector 的 vector(n) 类型。"""

    def __init__(self, dim: int):
        self.dim = dim

    def get_col_spec(self, **kw) -> str:
        return f"VECTOR({self.dim})"

    def bind_processor(self, dialect):
        """Python → Postgres：把 list[float] 转成 '[0.1, 0.2, ...]' 字符串。"""
        def process(value):
            if value is None:
                return None
            if isinstance(value, list):
                return "[" + ",".join(str(float(v)) for v in value) + "]"
            return value
        return process

    def result_processor(self, dialect, coltype):
        """Postgres → Python：把 '[0.1, 0.2]' 字符串转回 list[float]。"""
        def process(value):
            if value is None:
                return None
            # 去除两端括号，按逗号切分，转 float
            return [float(x) for x in str(value).strip("[]").split(",") if x.strip()]
        return process

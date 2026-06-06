# ============================================
# 赚了么 Docker 镜像构建
# ============================================

# ---------- Stage 1：Maven 编译 ----------
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /build

# 先复制 pom，利用 Docker 缓存下载依赖
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源码（含本地 application.yml，不入 git 仓库）
COPY src ./src

RUN mvn package -DskipTests -B

# ---------- Stage 2：运行时 ----------
FROM eclipse-temurin:21.0.5_11-jre

WORKDIR /app

# 从构建阶段复制 fat jar
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]

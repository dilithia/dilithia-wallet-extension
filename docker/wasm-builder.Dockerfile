FROM rust:1.88-bookworm

ENV PATH="/usr/local/cargo/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clang \
        ca-certificates \
        lld \
        pkg-config \
        wasi-libc \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown \
    && cargo install wasm-pack --locked

ENV CC_wasm32_unknown_unknown=clang
ENV CFLAGS_wasm32_unknown_unknown="-isystem /usr/include/wasm32-wasi"

WORKDIR /workspace

CMD ["bash"]

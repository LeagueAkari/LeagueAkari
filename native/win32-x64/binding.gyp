{
    "targets": [
        {
            "target_name": "akari-input-win64",
            "sources": [
                "./src/input/input.cc"
            ],
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "cxxflags": ["-std=c++17"],
            "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")",
                "./src"
            ],
            "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
            "libraries": [],
        },
        {
            "target_name": "akari-tools-win64",
            "sources": [
                "./src/tools/tools.cc"
            ],
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "cxxflags": ["-std=c++17"],
            "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")",
                "./src"
            ],
            "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
            "libraries": ["-lntdll"],
        }
    ]
}

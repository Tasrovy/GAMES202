set(CMAKE_POLICY_VERSION_MINIMUM 3.5)

cmake_minimum_required (VERSION 3.15)
project(nori)

# 1. 核心设置：必须启用 C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 2. 全局编译器选项 (关键：解决 TBB 和 OpenEXR 的报错)
# 这些选项必须放在 add_subdirectory 之前，才能对第三方库生效
if (MSVC)
  add_definitions(-DNOMINMAX -D_CRT_SECURE_NO_WARNINGS)
  add_definitions(-D_SILENCE_ALL_CXX17_DEPRECATION_WARNINGS)
  add_definitions(-D_SILENCE_CXX17_ADAPTOR_TYPEDEFS_DEPRECATION_WARNING)
  add_definitions(-D__TBB_NO_IMPLICIT_LINKAGE)
  add_compile_options(/permissive- /EHsc)
else()
  # Linux/WSL：全局开启 -fpermissive 解决 TBB 的 "changes meaning of task" 错误
  add_compile_options(-fpermissive)
  # 显式关闭这个特定的警告/错误
  add_compile_options(-Wno-changes-meaning)
endif()

# 3. 自动查找 Python (修复 NanoGUI 资源报错)
find_package(PythonInterp QUIET)

# 4. 引入子模块 (现在它们会继承上面的全局参数)
add_subdirectory(ext ext_build)

include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${TFM_INCLUDE_DIR}
  SYSTEM ${EIGEN_INCLUDE_DIR}
  SYSTEM ${OPENEXR_INCLUDE_DIRS}
  SYSTEM ${TBB_INCLUDE_DIR}
  ${PCG32_INCLUDE_DIR}
  ${PUGIXML_INCLUDE_DIR}
  ${HYPOTHESIS_INCLUDE_DIR}
  SYSTEM ${GLFW_INCLUDE_DIR}
  SYSTEM ${GLEW_INCLUDE_DIR}
  SYSTEM ${NANOVG_INCLUDE_DIR}
  SYSTEM ${NANOGUI_INCLUDE_DIR}
  SYSTEM ${NANOGUI_EXTRA_INCS}
  SYSTEM ${FILESYSTEM_INCLUDE_DIR}
  SYSTEM ${STB_IMAGE_WRITE_INCLUDE_DIR}
  SYSTEM ${SH_INCLUDE_DIRS}
)

# 5. 创建可执行文件
add_executable(nori
  src/bitmap.cpp
  src/block.cpp
  src/accel.cpp
  src/chi2test.cpp
  src/common.cpp
  src/diffuse.cpp
  src/gui.cpp
  src/independent.cpp
  src/main.cpp
  src/mesh.cpp
  src/obj.cpp
  src/object.cpp
  src/parser.cpp
  src/perspective.cpp
  src/proplist.cpp
  src/rfilter.cpp
  src/scene.cpp
  src/ttest.cpp
  src/warp.cpp
  src/microfacet.cpp
  src/mirror.cpp
  src/dielectric.cpp
  src/prt.cpp  # GAMES202 PRT 核心
  ext/spherical-harmonics/sh/spherical_harmonics.cc
  ext/spherical-harmonics/sh/default_image.cc
)

add_executable(warptest
  src/warp.cpp
  src/warptest.cpp
  src/microfacet.cpp
  src/object.cpp
  src/proplist.cpp
  src/common.cpp
)

# 6. 链接库
add_definitions(${NANOGUI_EXTRA_DEFS})

if (WIN32)
  target_link_libraries(nori tbb_static pugixml IlmImf nanogui ${NANOGUI_EXTRA_LIBS} zlibstatic)
else()
  target_link_libraries(nori tbb_static pugixml IlmImf nanogui ${NANOGUI_EXTRA_LIBS})
endif()

target_link_libraries(warptest tbb_static nanogui ${NANOGUI_EXTRA_LIBS})

# 7. 终端彩色输出
if (CMAKE_GENERATOR STREQUAL "Ninja")
  if (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fcolor-diagnostics")
  elseif (CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fdiagnostics-color=always")
  endif()
endif()
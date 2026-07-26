#!/bin/bash
set -e

echo "=> Downloading OpenJDK 17..."
cd ~
wget -q -c https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_linux-x64_bin.tar.gz
if [ ! -d "jdk-17.0.2" ]; then
  echo "=> Extracting OpenJDK 17..."
  tar -xzf openjdk-17.0.2_linux-x64_bin.tar.gz
fi
export JAVA_HOME=~/jdk-17.0.2
export PATH=$JAVA_HOME/bin:$PATH

echo "=> Downloading Android Command Line Tools..."
wget -q -c https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
mkdir -p android-sdk/cmdline-tools
if [ ! -d "android-sdk/cmdline-tools/latest" ]; then
  echo "=> Extracting Android Tools..."
  unzip -q commandlinetools-linux-11076708_latest.zip -d android-sdk/cmdline-tools
  mv android-sdk/cmdline-tools/cmdline-tools android-sdk/cmdline-tools/latest
fi

export ANDROID_HOME=~/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "=> Accepting Android SDK licenses and installing packages..."
yes | sdkmanager --licenses > /dev/null
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null

echo "=> Environment ready! Starting EAS local build..."
cd "/home/kairo/Documentos/Projetos Pessoais/CEFET-Academic-Planner/mobile"
npx eas-cli build --platform android --profile production --local

VERSION=$(node -p "require('./app.json').expo.version")
LATEST_AAB=$(ls -t *.aab 2>/dev/null | head -n1 || true)
if [ -n "$LATEST_AAB" ] && [ "$LATEST_AAB" != "app-release-v${VERSION}.aab" ]; then
  mv "$LATEST_AAB" "app-release-v${VERSION}.aab"
  echo "=> Build renomeado com sucesso para: app-release-v${VERSION}.aab"
fi

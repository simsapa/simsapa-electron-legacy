case "$TRAVIS_OS_NAME" in
    linux)
        ls -lh ./
        ls -lh out/
        ls -lh dist/
        ;;
    osx)
        ls -lh ./
        ls -lh out/
        ls -lh dist/
        ls -lh dist/mac
        ls -lhR dist/
        ;;
esac

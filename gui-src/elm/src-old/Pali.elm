module Pali exposing (..)

import Regex


-- TODO lookup stemmed and unstemmed forms as well


{--
wordDefinitions word =
    word
        |> sanitizeWord
        |> findCompounds
        |> List.map (\w -> stemWord w)
        |> List.map (\w -> lookupWord w)

lookupWord word =
    List.filter
        (\w -> String.startsWith (sanitizeWord w.term) word)
        paliDict
--}


findCompounds word =
    word
        |> findLike


findLike word =
    if String.endsWith "ṃva" word || String.endsWith "āva" word then
        [ deStemLike word, "va" ]
    else
        [ word ]


stemWord word =
    if List.member word [ "chāyā", "vā", "tato", "naṃ", "vahato" ] then
        word
    else
        word
            |> Regex.replaceAtMost 1 (Maybe.withDefault Regex.never <| Regex.fromString "ā$") (\_ -> "a")
            |> Regex.replaceAtMost 1 (Maybe.withDefault Regex.never <| Regex.fromString "ṃ$") (\_ -> "")
            |> Regex.replaceAtMost 1 (Maybe.withDefault Regex.never <| Regex.fromString "o$") (\_ -> "a")
            |> Regex.replaceAtMost 1 (Maybe.withDefault Regex.never <| Regex.fromString "ena$") (\_ -> "a")


deStemLike word =
    word
        |> Regex.replaceAtMost 1 (Maybe.withDefault Regex.never <| Regex.fromString "ṃva$") (\_ -> "")
        |> Regex.replaceAtMost 1 (Maybe.withDefault Regex.never <| Regex.fromString "āva$") (\_ -> "ā")


sanitizeWord word =
    word
        |> String.trim
        |> String.toLower
        |> removePunctuation


removePunctuation =
    Regex.replace (Maybe.withDefault Regex.never <| Regex.fromString "[,;]") (\_ -> "")

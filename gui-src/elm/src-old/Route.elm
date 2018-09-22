module Route exposing (..)

import Browser.Navigation as Nav
import Url exposing (Url)
import Url.Parser as Parser exposing (Parser, (</>), map, oneOf, s, string, top)


type Route
    = Home
    | ReadText
    | SearchTexts
    | SearchDictionary


type alias Model =
    Maybe Route


pathParser : Parser (Route -> a) a
pathParser =
    oneOf
        [ map SearchTexts top
        , map ReadText (s "read-text")
        , map SearchTexts (s "search-texts")
        , map SearchDictionary (s "search-dictionary")
        ]


init : Maybe Route -> List (Maybe Route)
init location =
    case location of
        Nothing ->
            [ Just Home ]

        something ->
            [ something ]


urlFor : Route -> String
urlFor loc =
    case loc of
        Home ->
            "/"

        ReadText ->
            "/read-text"

        SearchTexts ->
            "/search-texts"

        SearchDictionary ->
            "/search-dictionary"


locFor : Url -> Maybe Route
locFor path =
    Parser.parse pathParser path

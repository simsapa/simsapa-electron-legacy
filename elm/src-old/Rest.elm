module Rest exposing (fetchTextQuery, fetchDictWord, fetchLookupWord, poListDecoder)

import Http
import Json.Decode as Decode exposing (Decoder, int, list, string)
import Json.Decode.Pipeline exposing (required)
import Msg exposing (Msg(..))
import RemoteData
import Types exposing (..)


authorDecoder : Decoder Author
authorDecoder =
    Decode.succeed Author
        |> required "id" int
        |> required "uid" string
        |> required "blurb" string
        |> required "long_name" string
        |> required "short_name" string


poDecoder : Decoder PoMessage
poDecoder =
    Decode.succeed PoMessage
        |> required "msgid" string
        |> required "msgstr" string
        |> required "msgctxt" string
        |> required "encoding" string
        |> required "comment" string
        |> required "linenum" int


poListDecoder : Decoder (List PoMessage)
poListDecoder =
    list poDecoder


rootTextDecoder : Decoder RootText
rootTextDecoder =
    Decode.succeed RootText
        |> required "id" int
        |> required "uid" string
        |> required "author_uid" string
        |> required "acronym" string
        |> required "volpage" string
        |> required "title" string
        |> required "content_language" string
        |> required "content_plain" string
        |> required "content_html" string

translatedTextDecoder : Decoder TranslatedText
translatedTextDecoder =
    Decode.succeed TranslatedText
        |> required "id" int
        |> required "uid" string
        |> required "author_uid" string
        |> required "acronym" string
        |> required "volpage" string
        |> required "root_title" string
        |> required "translated_title" string
        |> required "content_language" string
        |> required "content_plain" string
        |> required "content_html" string

textQueryDataDecoder : Decoder TextQueryData
textQueryDataDecoder =
    Decode.succeed TextQueryData
        |> required "root_texts" (list rootTextDecoder)
        |> required "translated_texts" (list translatedTextDecoder)

dictWordDecoder : Decoder DictWord
dictWordDecoder =
    Decode.succeed DictWord
        |> required "id" int
        |> required "word" string
        |> required "definition" string
        |> required "summary" string
        |> required "grammar" string
        |> required "entry_source" string
        |> required "from_lang" string
        |> required "to_lang" string

fetchTextQuery : String -> Cmd Msg
fetchTextQuery query =
    textQueryDataDecoder
        |> Http.get ("http://localhost:3030/search/texts/" ++ query)
        |> RemoteData.sendRequest
        |> Cmd.map TextQueryDataReceived

fetchDictWord : String -> Cmd Msg
fetchDictWord query =
    (list dictWordDecoder)
        |> Http.get ("http://localhost:3030/search/dict_words/" ++ query)
        |> RemoteData.sendRequest
        |> Cmd.map DictLookupDataReceived

fetchLookupWord : String -> Cmd Msg
fetchLookupWord query =
    (list dictWordDecoder)
        |> Http.get ("http://localhost:3030/search/dict_words/" ++ query)
        |> RemoteData.sendRequest
        |> Cmd.map LookupWordDataReceived

module View.SearchDictionary exposing (Model, Msg, update, view)

import Html exposing (..)
import Html.Attributes exposing (..)
import Markdown.Config as MDConf
import RemoteData exposing (WebData)

mdRawHtml =
    Just (MDConf.Options False MDConf.ParseUnsafe)

view : (Msg m -> m) -> Model -> Html m
view lift model =
    article [] [ text "hey search dictionary" ]


type alias Model =
    {}

type alias LookupState =
    { currentWord : WebData (List DictWord) }


type alias DictionarySearchState =
    { lookupQuery : String
    , lookupResults : WebData (List DictWord)
    , selectedWordsList : List DictWord
    }


type alias DictWord =
    { id : Int
    , word : String
    , definition : String
    , summary : String
    , grammar : String
    , entry_source : String
    , from_lang : String
    , to_lang : String
    }


type Msg m
    = NoOp


update : (Msg m -> m) -> Msg m -> Model -> ( Model, Cmd m )
update lift msg model =
    ( model, Cmd.none )

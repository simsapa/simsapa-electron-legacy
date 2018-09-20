module Model exposing (Model, init)

import Browser.Navigation as Nav
import Dict exposing (Dict)
import Material
import Msg exposing (Msg(..))
import RemoteData exposing (WebData)
import Rest exposing (fetchDictWord)
import Route exposing (Route)
import Types exposing (..)
import Url


type alias Model =
    { mdc : Material.Model Msg
    , key : Nav.Key
    , history : List (Maybe Route)
    , textSearchState : TextSearchState
    , lookupState : LookupState
    , dictionarySearchState : DictionarySearchState
    , textReadState : TextReadState
    }


init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    ( initialModel (Route.locFor url) key, Cmd.batch [ Material.init Mdc ] )

initialModel : Maybe Route -> Nav.Key -> Model
initialModel location key =
    { mdc = Material.defaultModel
    , key = key
    , history = Route.init location
    , textSearchState = initialTextSearchState
    , lookupState = initialLookupState
    , dictionarySearchState = initialDictionarySearchState
    , textReadState = initialTextReadState
    }


initialTextSearchState : TextSearchState
initialTextSearchState =
    { lookupQuery = ""
    , lookupResults = RemoteData.NotAsked
    , selectedText = Nothing
    , selectedTextList = []
    }


initialLookupState : LookupState
initialLookupState =
    { currentWord = RemoteData.NotAsked }


initialDictionarySearchState : DictionarySearchState
initialDictionarySearchState =
    { lookupQuery = ""
    , lookupResults = RemoteData.NotAsked
    , selectedWordsList = []
    }

initialTextReadState : TextReadState
initialTextReadState =
    { selectedText = Nothing }
